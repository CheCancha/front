import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Section,
  Row,
  Column,
} from "@react-email/components";
import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface EmailProps {
  booking: {
    user: { name: string } | null;
    court: { name: string; complex: { name: string } };
    date: Date;
    startTime: number;
    startMinute: number;
    refundPending: boolean;
  };
}

export const BookingCancelledByPlayerEmail = ({ booking }: EmailProps) => {
  const formattedDate = format(booking.date, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es });
  const formattedTime = `${String(booking.startTime).padStart(2, '0')}:${String(booking.startMinute).padStart(2, '0')}`;

  return (
    <Html>
      <Head />
      <Preview>Un jugador ha cancelado su reserva.</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>Cancelación de Reserva</Heading>
          <Text style={paragraph}>
            Hola, te informamos que el jugador **{booking.user?.name || "un usuario"}** ha cancelado su reserva en tu complejo. El horario ahora se encuentra nuevamente disponible en la plataforma.
          </Text>
          
          <Section style={detailsSection}>
            <Row>
              <Column style={label}>Complejo:</Column>
              <Column style={value}>{booking.court.complex.name}</Column>
            </Row>
            <Row>
              <Column style={label}>Cancha:</Column>
              <Column style={value}>{booking.court.name}</Column>
            </Row>
            <Row>
              <Column style={label}>Fecha:</Column>
              <Column style={value}>{formattedDate}</Column>
            </Row>
            <Row>
              <Column style={label}>Horario:</Column>
              <Column style={value}>{formattedTime}</Column>
            </Row>
          </Section>

          <Text style={paragraph}>
            **Estado del Reembolso:** {booking.refundPending ? "La cancelación se realizó dentro del período permitido. Se ha marcado la seña para su reembolso." : "La cancelación se realizó fuera del período permitido. No corresponde un reembolso de la seña."}
          </Text>

          <Text style={footer}>
            Equipo de CheCancha
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default BookingCancelledByPlayerEmail;

// --- Estilos ---
const main = { backgroundColor: "#f6f9fc", fontFamily: "Arial, sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "20px 48px", marginBottom: "64px", border: "1px solid #e6ebf1", borderRadius: "5px" };
const heading = { color: "#333", fontSize: "24px", fontWeight: "bold", textAlign: "center" as const, marginBottom: "24px" };
const paragraph = { color: "#555", fontSize: "16px", lineHeight: "24px" };
const detailsSection = { border: "1px solid #eaeaea", borderRadius: "5px", padding: "20px", margin: "20px 0" };
const label = { color: "#888", width: "100px" };
const value = { color: "#333", fontWeight: "bold" };
const footer = { color: "#888", fontSize: "12px", marginTop: "24px", textAlign: "center" as const };