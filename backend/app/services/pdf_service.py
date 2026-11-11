import io
from datetime import datetime
from decimal import Decimal
from typing import BinaryIO
from fastapi import HTTPException, status
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether, HRFlowable

from app.models import ExerciceAnnuel
from app.services.bilan_service import get_bilan_complet


def generer_rapport_financier_pdf(db: Session, exercice_id: str) -> io.BytesIO:
    """
    Génère un rapport financier officiel complet en PDF prêt pour le téléchargement.
    """
    exercice = db.get(ExerciceAnnuel, exercice_id)
    if not exercice or exercice.deleted_at is not None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Exercice introuvable")

    bilan = get_bilan_complet(db, exercice_id)

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        rightMargin=36,
        leftMargin=36,
        topMargin=36,
        bottomMargin=36
    )

    styles = getSampleStyleSheet()
    
    # Styles personnalisés
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        leading=22,
        alignment=1,  # Centré
        textColor=colors.HexColor("#1E3A8A")  # Bleu marine
    )
    subtitle_style = ParagraphStyle(
        "DocSubtitle",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        alignment=1,
        textColor=colors.HexColor("#4B5563")
    )
    section_heading = ParagraphStyle(
        "SectionHeading",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=13,
        leading=16,
        textColor=colors.HexColor("#1F2937"),
        spaceBefore=12,
        spaceAfter=6
    )
    body_style = ParagraphStyle(
        "Body",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=9,
        leading=12
    )
    body_bold = ParagraphStyle(
        "BodyBold",
        parent=body_style,
        fontName="Helvetica-Bold"
    )

    story = []

    # 1. En-tête officiel
    story.append(Paragraph("COMMUNAUTÉ DES ÉTUDIANTS ET STAGIAIRES AFRICAINS AU MAROC", subtitle_style))
    story.append(Paragraph("<b>C.E.E.A.M. — DIRECTION DU TRÉSOR</b>", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(Paragraph(f"RAPPORT FINANCIER ANNUEL — EXERCICE {exercice.libelle}", title_style))
    story.append(Spacer(1, 4))
    date_str = datetime.now().strftime("%d/%m/%Y à %H:%M")
    story.append(Paragraph(f"Édité officiellement le {date_str} | Statut : <b>{exercice.statut.value}</b>", subtitle_style))
    story.append(Spacer(1, 10))
    story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#1E3A8A"), spaceAfter=15))

    # 2. Synthèse du Bilan (KPIs)
    story.append(Paragraph("1. SYNTHÈSE DE LA SITUATION FINANCIÈRE", section_heading))
    
    solde_init = f"{bilan['solde_initial']:,.2f} MAD".replace(",", " ")
    total_recettes = f"{bilan['total_cotise']:,.2f} MAD".replace(",", " ")
    total_charges = f"{bilan['total_depense']:,.2f} MAD".replace(",", " ")
    solde_dispo = f"{bilan['solde_disponible']:,.2f} MAD".replace(",", " ")

    kpi_data = [
        [
            Paragraph("<b>Report à nouveau (Solde Initial)</b>", body_style),
            Paragraph(solde_init, body_bold)
        ],
        [
            Paragraph("<b>Total Recettes (Cotisations perçues)</b>", body_style),
            Paragraph(f"<font color='#059669'><b>+{total_recettes}</b></font>", body_bold)
        ],
        [
            Paragraph("<b>Total Charges (Dépenses réalisées)</b>", body_style),
            Paragraph(f"<font color='#DC2626'><b>-{total_charges}</b></font>", body_bold)
        ],
        [
            Paragraph("<b>SOLDE DISPONIBLE EN TRÉSORERIE</b>", body_bold),
            Paragraph(f"<font color='#1E40AF' size=11><b>{solde_dispo}</b></font>", body_bold)
        ]
    ]

    table_kpi = Table(kpi_data, colWidths=[340, 180])
    table_kpi.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F9FAFB")),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E5E7EB")),
        ('PADDING', (0, 0), (-1, -1), 6),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BACKGROUND', (0, 3), (-1, 3), colors.HexColor("#EFF6FF")),  # Ligne solde en surbrillance bleue
    ]))
    story.append(table_kpi)
    story.append(Spacer(1, 15))

    # 3. Répartition des Cotisations par Pays
    story.append(Paragraph("2. RECOUVREMENT DES COTISATIONS PAR PAYS MEMBRE", section_heading))
    
    pays_table_data = [
        [
            Paragraph("<b>Pays</b>", body_bold),
            Paragraph("<b>Effectif</b>", body_bold),
            Paragraph("<b>Cotisants</b>", body_bold),
            Paragraph("<b>Taux Part.</b>", body_bold),
            Paragraph("<b>Total Versé</b>", body_bold)
        ]
    ]

    for p in bilan["repartition_pays"]:
        montant_str = f"{p['total_cotise']:,.2f} MAD".replace(",", " ")
        pays_table_data.append([
            Paragraph(f"{p['pays_nom']} ({p['code_iso'] or '-'})", body_style),
            Paragraph(str(p['nombre_etudiants']), body_style),
            Paragraph(str(p['nombre_cotisants']), body_style),
            Paragraph(f"{p['taux_participation']}%", body_style),
            Paragraph(montant_str, body_bold)
        ])

    table_pays = Table(pays_table_data, colWidths=[180, 75, 75, 80, 110])
    table_pays.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#1E3A8A")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table_pays)
    story.append(Spacer(1, 15))

    # 4. Détail des Dépenses par Activité
    story.append(Paragraph("3. DÉPENSES PAR ACTIVITÉ & CONTRÔLE BUDGÉTAIRE", section_heading))
    
    act_table_data = [
        [
            Paragraph("<b>Activité</b>", body_bold),
            Paragraph("<b>Date</b>", body_bold),
            Paragraph("<b>Budget Prévu</b>", body_bold),
            Paragraph("<b>Dépensé Réel</b>", body_bold),
            Paragraph("<b>Écart / Dépassement</b>", body_bold)
        ]
    ]

    if not bilan["comparaison_activites"]:
        act_table_data.append([
            Paragraph("<i>Aucune activité enregistrée pour cet exercice</i>", body_style),
            Paragraph("-", body_style),
            Paragraph("-", body_style),
            Paragraph("-", body_style),
            Paragraph("-", body_style)
        ])
    else:
        for a in bilan["comparaison_activites"]:
            b_prevu = f"{a['budget_prevu']:,.2f} MAD".replace(",", " ") if a['budget_prevu'] is not None else "-"
            dep_reel = f"{a['total_depense']:,.2f} MAD".replace(",", " ")
            if a["depassement"]:
                ecart_str = f"<font color='#DC2626'><b>+{a['ecart']:,.2f} MAD (Dépassement)</b></font>".replace(",", " ")
            else:
                ecart_str = "<font color='#059669'>Conforme</font>"

            act_table_data.append([
                Paragraph(a['nom'], body_style),
                Paragraph(a['date_activite'], body_style),
                Paragraph(b_prevu, body_style),
                Paragraph(dep_reel, body_bold),
                Paragraph(ecart_str, body_style)
            ])

    table_act = Table(act_table_data, colWidths=[150, 75, 95, 95, 105])
    table_act.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#374151")),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#D1D5DB")),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, colors.HexColor("#F9FAFB")]),
        ('PADDING', (0, 0), (-1, -1), 5),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ]))
    story.append(table_act)
    story.append(Spacer(1, 25))

    # 5. Signatures
    signatures_data = [
        [
            Paragraph("<b>Pour le Trésorier Général</b><br/><br/><br/><br/><i>Nom & Signature</i>", body_style),
            Paragraph("<b>Pour le Président de la CEEAM</b><br/><br/><br/><br/><i>Nom & Signature</i>", body_style)
        ]
    ]
    table_signatures = Table(signatures_data, colWidths=[260, 260])
    table_signatures.setStyle(TableStyle([
        ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#9CA3AF")),
        ('LINEBEFORE', (1, 0), (1, -1), 1, colors.HexColor("#9CA3AF")),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    
    story.append(KeepTogether(table_signatures))

    # Compilation du document PDF
    doc.build(story)
    buffer.seek(0)
    return buffer
