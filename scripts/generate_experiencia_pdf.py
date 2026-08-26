# scripts/generate_experiencia_pdf.py
# Generador automatizado del Documento de Experiencia Grupal APA 7ma para ONETP 2026

import os
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, KeepTogether
)

def generate_pdf():
    output_path = os.path.join(
        "doc", "0_Gestion Y Planificacion",
        "Registro_de_Experiencia_Grupal_y_Autoevaluacion_APA.pdf"
    )
    
    # Margenes ajustados para entrar exactamente en 1 carilla (54 pt = 0.75 in)
    doc = SimpleDocTemplate(
        output_path,
        pagesize=letter,
        leftMargin=36,
        rightMargin=36,
        topMargin=28,
        bottomMargin=28
    )

    styles = getSampleStyleSheet()
    
    # Estilos tipograficos limpios
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=11,
        leading=13,
        textColor=colors.HexColor('#0F2A4A'),
        alignment=1, # Centrado
        spaceAfter=2
    )
    
    subtitle_style = ParagraphStyle(
        'DocSubtitle',
        parent=styles['Normal'],
        fontName='Helvetica',
        fontSize=8,
        leading=10,
        textColor=colors.HexColor('#334155'),
        alignment=1,
        spaceAfter=4
    )

    meta_label = ParagraphStyle(
        'MetaLabel',
        fontName='Helvetica-Bold',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#0F2A4A')
    )
    
    meta_val = ParagraphStyle(
        'MetaVal',
        fontName='Helvetica',
        fontSize=7,
        leading=8.5,
        textColor=colors.HexColor('#1E293B')
    )

    q_title_style = ParagraphStyle(
        'QTitle',
        fontName='Helvetica-Bold',
        fontSize=7.5,
        leading=9.5,
        textColor=colors.HexColor('#0F2A4A'),
        spaceBefore=2,
        spaceAfter=1
    )

    p_style = ParagraphStyle(
        'BodyTextCustom',
        fontName='Helvetica',
        fontSize=6.8,
        leading=8.5,
        textColor=colors.HexColor('#1E293B'),
        alignment=4 # Justificado
    )

    sig_name = ParagraphStyle(
        'SigName',
        fontName='Helvetica-Bold',
        fontSize=6.5,
        leading=8,
        textColor=colors.HexColor('#0F2A4A'),
        alignment=1
    )

    sig_role = ParagraphStyle(
        'SigRole',
        fontName='Helvetica',
        fontSize=5.8,
        leading=7,
        textColor=colors.HexColor('#475569'),
        alignment=1
    )

    footer_text = ParagraphStyle(
        'FooterText',
        fontName='Helvetica-Bold',
        fontSize=5.8,
        leading=7,
        textColor=colors.HexColor('#64748B'),
        alignment=1
    )

    story = []

    # 1. Encabezado Oficial
    story.append(Paragraph("INFORME REFLEXIVO DE EVALUACIÓN TÉCNICA Y GRUPAL", title_style))
    story.append(Paragraph("REGISTRO DE EXPERIENCIA GRUPAL Y AUTOEVALUACIÓN (APA 7.ª ED.)", title_style))
    story.append(Paragraph("Reflexión del Equipo de Desarrollo sobre la Resolución de la Problemática — Plataforma Código Azul", subtitle_style))

    # 2. Metadatos Institucionales
    meta_data = [
        [
            Paragraph("<b>INSTITUCIÓN & SEDE:</b>", meta_label),
            Paragraph("E.E.S.T. N.º 2 \"Educación y Trabajo\" — Prov. de Buenos Aires", meta_val),
            Paragraph("<b>CERTAMEN:</b>", meta_label),
            Paragraph("Olimpíada Nacional ETP 2026 (INET)", meta_val),
        ],
        [
            Paragraph("<b>PROYECTO:</b>", meta_label),
            Paragraph("Sistema Hospitalario de Código Azul (Tiempo Real & Misión Crítica)", meta_val),
            Paragraph("<b>EQUIPO & ROLES:</b>", meta_label),
            Paragraph("A. Martinez (QA/Arq), I. Cardozo (Backend), F. Sarraute (Frontend/PWA), A. Heredia (Push/Telem), M. Silvani (Analista/UML)", meta_val),
        ]
    ]
    
    meta_table = Table(meta_data, colWidths=[90, 180, 75, 195])
    meta_table.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#F1F5F9')),
        ('BOX', (0,0), (-1,-1), 0.5, colors.HexColor('#CBD5E1')),
        ('INNERGRID', (0,0), (-1,-1), 0.25, colors.HexColor('#E2E8F0')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 2),
        ('LEFTPADDING', (0,0), (-1,-1), 4),
        ('RIGHTPADDING', (0,0), (-1,-1), 4),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 3))

    # 3. Pregunta 1
    story.append(Paragraph("1. ¿Cómo se organizaron los tiempos, división de tareas y roles?", q_title_style))
    p1 = (
        "Para abordar la consigna en los plazos requeridos, adoptamos una metodología ágil estructurada en cuatro fases secuenciales: "
        "1) Análisis Funcional, Requerimientos IEEE 830 y Modelado Canónico UML 2.5 (a cargo de Marcos Silvani); "
        "2) Construcción del Núcleo Backend, Persistencia Relacional ACID y Transaccionalidad en PostgreSQL 18 (liderado por Ivan Cardozo); "
        "3) Infraestructura de Tiempo Real, Firebase Admin SDK y Auditoría de Telemetría Push (desarrollado por Alex Heredia); y "
        "4) Desarrollo de Interfaces Integradas (PWA Móvil de Alarma y Dashboard Hospitalario PC con reactividad y gráficos SVG) "
        "desarrolladas integralmente por Franco Sarraute. Alan Martinez coordinó la arquitectura global, la matriz de trazabilidad y "
        "la suite de 17 pruebas automatizadas de aseguramiento de calidad (QA)."
    )
    story.append(Paragraph(p1, p_style))

    # 4. Pregunta 2
    story.append(Paragraph("2. ¿Cómo funcionaron como equipo?", q_title_style))
    p2 = (
        "El equipo operó bajo una dinámica de alta sinergia colaborativa y comunicación continua. La decisión arquitectónica clave (ADR-01) de "
        "implementar Clean Architecture con patrón Feature-First permitió que el backend, la infraestructura de tiempo real y los clientes web/móvil "
        "avanzaran en paralelo sin colisiones en Git (mediante Conventional Commits). Establecimos contratos rigurosos de interfaz (JSON REST "
        "y eventos Socket.IO como incidente:activado, incidente:ack, incidente:resuelto e incidente:cancelado), lo que posibilitó realizar pruebas "
        "cruzadas y revisiones de pares tempranas. La coordinación de QA garantizó que cada componente fuera validado contra la matriz de requerimientos "
        "del SRS antes de consolidar la rama de entrega."
    )
    story.append(Paragraph(p2, p_style))

    # 5. Pregunta 3
    story.append(Paragraph("3. ¿Cuáles fueron las principales dificultades para la resolución de la tarea? ¿Pudieron resolverlo? ¿Cómo?", q_title_style))
    p3 = (
        "Durante el desarrollo se superaron cuatro retos técnicos de alta complejidad propios de los entornos hospitalarios críticos: "
        "1) Prevención de saturación por pulsaciones repetidas: implementamos una Barrera de Idempotencia de 60s indexada en PostgreSQL que retorna "
        "el incidente activo con HTTP 200 sin duplicar registros; 2) Notificación a móviles en reposo (Doze Mode): configuramos Firebase Cloud Messaging "
        "con prioridad 'high' y canal crítico; 3) Blindaje médico-legal inmutable: desarrollamos un trigger en PostgreSQL (trg_audit_immutable) "
        "que rechaza irrevocablemente sentencias UPDATE o DELETE sobre la auditoría; y 4) Cierre del ciclo clínico: incorporamos el caso de uso de "
        "resolución (EN_ATENCION -> RESUELTO) y desregistro de tokens FCM en logout para evitar alertas a dispositivos fuera de guardia."
    )
    story.append(Paragraph(p3, p_style))

    # 6. Pregunta 4
    story.append(Paragraph("4. Reflexión Final y Aprendizaje Técnico", q_title_style))
    p4 = (
        "La resolución de esta problemática representó un hito formativo decisivo. Logramos articular estándares internacionales de ingeniería "
        "(IEEE 830, ISO/IEC 25010, Normas APA 7.ª Ed.) con buenas prácticas profesionales de arquitectura limpia, transaccionalidad ACID y "
        "despliegue contenerizado en Docker. Demostramos que el software confiable, auditable y de latencia ultra-baja es una herramienta vital "
        "para optimizar los tiempos de respuesta médica y salvar vidas humanas en el sistema de salud pública."
    )
    story.append(Paragraph(p4, p_style))
    story.append(Spacer(1, 4))

    # 7. Firmas de los 5 integrantes con roles actualizados
    sig_data = [
        [
            Paragraph("<b>Alan Martinez</b>", sig_name),
            Paragraph("<b>Ivan Ismael Cardozo</b>", sig_name),
            Paragraph("<b>Franco Sarraute</b>", sig_name),
            Paragraph("<b>Alex Heredia</b>", sig_name),
            Paragraph("<b>Marcos Silvani</b>", sig_name),
        ],
        [
            Paragraph("Líder Arq. & QA Lead", sig_role),
            Paragraph("Backend Core & DB Architect", sig_role),
            Paragraph("Frontend & Mobile Lead", sig_role),
            Paragraph("Push & Telemetría Lead", sig_role),
            Paragraph("Systems Analyst & UML Lead", sig_role),
        ]
    ]
    sig_table = Table(sig_data, colWidths=[108, 108, 108, 108, 108])
    sig_table.setStyle(TableStyle([
        ('LINEABOVE', (0,0), (-1,0), 0.5, colors.HexColor('#94A3B8')),
        ('TOPPADDING', (0,0), (-1,-1), 2),
        ('BOTTOMPADDING', (0,0), (-1,-1), 1),
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
    ]))
    story.append(sig_table)
    story.append(Spacer(1, 3))

    # Pie de página institucional
    story.append(Paragraph(
        "OLIMPÍADA NACIONAL DE ETP 2026 — REGISTRO DE EXPERIENCIA GRUPAL (MÁX. 1 CARILLA) — PÁGINA 1 DE 1 — E.E.S.T. N.º 2",
        footer_text
    ))

    doc.build(story)
    print(f"[OK] Generado exitosamente: {output_path}")

if __name__ == '__main__':
    generate_pdf()
