import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { APP_ID } from '../../lib/constants';
import { Event } from '../../types/schema';
import { Musiker } from '../../services/firebase/musikerService';

export function HonorarnotePrint() {
  const { eventId, musikerId } = useParams<{ eventId: string; musikerId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [musiker, setMusiker] = useState<Musiker | null>(null);
  const [gage, setGage] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      if (!eventId || !musikerId) return;
      try {
        const eventSnap = await getDoc(doc(db, `apps/${APP_ID}/events`, eventId));
        const musikerSnap = await getDoc(doc(db, `apps/${APP_ID}/musiker`, musikerId));

        if (eventSnap.exists() && musikerSnap.exists()) {
          const eventData = eventSnap.data() as Event;
          const musikerData = musikerSnap.data() as Musiker;

          const member = eventData.ensemble?.find(e => e.musikerId === musikerId);
          setGage(member?.gage || 0);
          setEvent(eventData);
          setMusiker(musikerData);
        }
      } catch (err) {
        console.error('Error loading honorarnote data:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [eventId, musikerId]);

  useEffect(() => {
    if (!loading && event && musiker) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [loading, event, musiker]);

  if (loading) return <div className="p-8">Lade Daten für Honorarnote...</div>;
  if (!event || !musiker) return <div className="p-8 text-red-600">Fehler: Daten nicht gefunden.</div>;

  const getValidDate = (d: any) => {
    if (!d) return new Date();
    if (typeof d === 'string') return new Date(d);
    if (typeof d.toDate === 'function') return d.toDate();
    if (d instanceof Date) return d;
    return new Date();
  };

  const eventDate = getValidDate(event.date);
  const formattedDate = eventDate.toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const formattedTime = event.time;
  
  const formatter = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });
  const netto = gage;
  const mwstRate = musiker.steuersatz || 0;
  const mwstAmount = netto * (mwstRate / 100);
  const brutto = netto + mwstAmount;

  const today = new Date().toLocaleDateString('de-AT', { day: '2-digit', month: '2-digit', year: 'numeric' });

  return (
    <div className="bg-white text-black min-h-screen p-8 max-w-4xl mx-auto font-sans print:p-0 print:m-0">
      {/* Kopfzeile */}
      <div className="flex justify-between items-start mb-16">
        <div>
          <p className="font-bold">{musiker.vorname} {musiker.nachname}</p>
          <p>{musiker.strasse}</p>
          <p>{musiker.plz} {musiker.ort}</p>
          {musiker.steuernummer && <p className="mt-2 text-sm">Steuernummer: {musiker.steuernummer}</p>}
        </div>
        <div className="text-right">
          <p>Wien am, {today}</p>
        </div>
      </div>

      {/* Empfänger */}
      <div className="mb-16">
        <p className="font-bold">An</p>
        <p className="font-bold">Konzerte im Mozarthaus</p>
        <p className="font-bold">Claudio Cunha Bentes</p>
        <p className="font-bold">Konzertveranstalter</p>
        <p className="font-bold">Singerstrasse 7</p>
        <p className="font-bold">A - 1010 Wien</p>
      </div>

      {/* Titel */}
      <h1 className="text-3xl font-bold text-center mb-12 tracking-wider">HONORARNOTE</h1>

      {/* Einleitungstext */}
      <p className="mb-8 leading-relaxed">
        Für meine Auftritte in der Sala Terrena im Deutsch Ordenshaus, Singerstraße 7, 1010 Wien, erlaube ich mir folgenden Betrag in Rechnung zu stellen:
      </p>

      {/* Tabelle */}
      <table className="w-full border-collapse mb-12">
        <thead>
          <tr className="bg-[#8b0000] text-white">
            <th className="p-3 text-left border border-[#8b0000]">Konzert am</th>
            <th className="p-3 text-right border border-[#8b0000]">Nettobetrag</th>
            <th className="p-3 text-right border border-[#8b0000]">MwSt</th>
            <th className="p-3 text-right border border-[#8b0000]">Bruttobetrag</th>
            <th className="p-3 text-right border border-[#8b0000]">Spesen</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td className="p-3 border border-gray-300">{formattedDate} {formattedTime} Uhr</td>
            <td className="p-3 text-right border border-gray-300">{formatter.format(netto)}</td>
            <td className="p-3 text-right border border-gray-300">{mwstRate.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} %</td>
            <td className="p-3 text-right border border-gray-300 font-bold">{formatter.format(brutto)}</td>
            <td className="p-3 text-right border border-gray-300">&euro;</td>
          </tr>
          <tr className="bg-[#8b0000] text-white font-bold">
            <td className="p-3 text-left border border-[#8b0000]" colSpan={3}>Summe der Beträge</td>
            <td className="p-3 text-right border border-[#8b0000]">{formatter.format(brutto)}</td>
            <td className="p-3 text-right border border-[#8b0000]"></td>
          </tr>
        </tbody>
      </table>

      {/* Fußtexte */}
      <div className="space-y-6">
        <p>Der Betrag von <span className="font-bold">{formatter.format(brutto)}</span> + ________ &euro; Spesenersatz wird auf Ihr Konto überwiesen.</p>
        
        <p>Ich nehme zur Kenntnis, daß ich für die Versteuerung der Honorare selbst sorgen muß, da kein Dienstverhältnis vorliegt.</p>
        
        <div className="mt-24">
          <p>Unterschrift: ___________________________________</p>
        </div>
      </div>
    </div>
  );
}
