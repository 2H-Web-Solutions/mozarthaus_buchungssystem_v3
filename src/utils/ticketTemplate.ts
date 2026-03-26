import { Booking, Event } from '../types/schema';

export function generateTicketHTML(booking: Booking, event: Event): string {
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(booking.id)}`;
  
  const eventDateStr = typeof event.date !== 'string' && (event.date as any)?.toDate 
    ? (event.date as any).toDate().toLocaleDateString('de-AT', { dateStyle: 'full' }) 
    : String(event.date);

  const getPaymentStatusText = () => {
    switch(booking.status) {
      case 'paid':
        return `<span style="color: #16a34a; font-weight: bold;">Bereits bezahlt (${booking.paymentMethod?.toUpperCase() || 'ONLINE'})</span>`;
      case 'confirmed':
        return `<span style="color: #2563eb; font-weight: bold;">Bestätigt (Bitte an der Abendkasse begleichen)</span>`;
      default:
        return `<span style="color: #ca8a04; font-weight: bold;">Status: ${booking.status}</span>`;
    }
  };

  const getSeatsHtml = () => {
    if (booking.tickets && booking.tickets.length > 0) {
      return booking.tickets.map((t) => 
        `<li>1x Ticket - Kategorie: ${t.categoryId} ${t.seatId ? `(Sitzplatz: ${t.seatId.replace(/row_|_seat_/g, ' ').toUpperCase()})` : ''}</li>`
      ).join('');
    }
    
    if (booking.seatIds && booking.seatIds.length > 0) {
      return booking.seatIds.map(seatId => 
        `<li>1x Sitzplatz: ${seatId.replace(/row_|_seat_/g, ' ').toUpperCase()}</li>`
      ).join('');
    }

    return `<li>1x Ticket (Ohne feste Platzkategorie)</li>`;
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Ihre Tickets für das Mozarthaus</title>
      <style>
        body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f9fafb; margin: 0; padding: 0; color: #1f2937; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06); }
        .header { background-color: #c02a2a; padding: 30px; text-align: center; color: #ffffff; }
        .header h1 { margin: 0; font-size: 28px; letter-spacing: 2px; text-transform: uppercase; }
        .header-bg { background-image: url('https://www.mozarthaus.at/fileadmin/templates/res/img/logo-weiss.svg'); background-size: contain; background-repeat: no-repeat; background-position: center; height: 50px; margin-bottom: 20px;}
        .content { padding: 40px 30px; }
        .greeting { font-size: 18px; font-weight: bold; margin-bottom: 20px; }
        .event-card { background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; padding: 20px; margin-bottom: 30px; }
        .event-title { font-size: 20px; font-weight: bold; color: #111827; margin: 0 0 10px 0; }
        .event-details { margin: 0; color: #4b5563; font-size: 16px; line-height: 1.5; }
        .ticket-info { margin-bottom: 30px; }
        .ticket-info h3 { margin-top: 0; border-bottom: 1px solid #e5e7eb; padding-bottom: 10px; }
        .ticket-list { list-style-type: none; padding: 0; margin: 0; }
        .ticket-list li { background-color: #f9fafb; border: 1px solid #e5e7eb; padding: 12px 15px; margin-bottom: 8px; border-radius: 4px; font-weight: 500; }
        .payment-status { padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 4px; margin-bottom: 30px; text-align: center; }
        .qr-section { text-align: center; margin-top: 40px; border-top: 2px dashed #e5e7eb; padding-top: 30px; }
        .qr-code { width: 150px; height: 150px; margin: 0 auto 15px auto; display: block; }
        .qr-hint { color: #6b7280; font-size: 14px; margin-bottom: 5px; }
        .booking-id { font-family: monospace; font-size: 12px; color: #9ca3af; }
        .footer { background-color: #f3f4f6; padding: 20px; text-align: center; font-size: 12px; color: #6b7280; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <!-- Fallback Text falls Bild nicht lädt -->
          <h1 style="display: none;">MOZARTHAUS</h1>
          <div style="font-size: 32px; font-weight: 900; letter-spacing: 4px;">MOZARTHAUS</div>
          <div style="font-size: 14px; letter-spacing: 2px; margin-top: 5px;">VIENNA CONCERTS</div>
        </div>
        
        <div class="content">
          <div class="greeting">Guten Tag ${booking.customerData.name},</div>
          
          <p>vielen Dank für Ihre Buchung! Hier sind Ihre Ticket-Informationen:</p>
          
          <div class="event-card">
            <h2 class="event-title">${event.title}</h2>
            <p class="event-details">
              <strong>Datum:</strong> ${eventDateStr}<br>
              <strong>Einlass & Beginn:</strong> ${event.time || ''} Uhr<br>
              <strong>Ort:</strong> Mozarthaus Wien
            </p>
          </div>
          
          <div class="ticket-info">
            <h3>Ihre Plätze</h3>
            <ul class="ticket-list">
              ${getSeatsHtml()}
            </ul>
          </div>
          
          <div class="payment-status">
            ${getPaymentStatusText()}
            <div><strong>Gesamtbetrag: € ${booking.totalAmount.toLocaleString('de-AT', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong></div>
          </div>
          
          <div class="qr-section">
            <img src="${qrCodeUrl}" alt="Check-In QR Code" class="qr-code" />
            <p class="qr-hint">Zeigen Sie diesen QR-Code beim Eingang vor.</p>
            <p class="booking-id">Buchungs-Referenz: ${booking.id}</p>
          </div>
        </div>
        
        <div class="footer">
          Mozarthaus Buchungssystem | +43 1 234 5678 | info@mozarthaus.at<br>
          © ${new Date().getFullYear()} Mozarthaus Vienna
        </div>
      </div>
    </body>
    </html>
  `;
}
