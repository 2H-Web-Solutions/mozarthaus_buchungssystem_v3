import { doc, writeBatch } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { APP_ID } from '../lib/constants';

const rawData = `316	MITARBEITER_ART	Oliveira Sousa	Nathalia	Robert-Preußler-straße 28/140	5020 Salzburg	+436601705419	naah.music HOTMAIL.COM		0 %
299	MITARBEITER_ART	Abedian	Taha	Damböckgasse 3-5 Stiege 2 Tür 14	1060				0 %
79	MITARBEITER	Aberer	Carmen	Aspangstrasse 53/22	1030 Wien				0 %
171	MUSIKER	Abraham	Laszlo	Krudy Gyula u. 14/11	9700 Szombatrhely	+4369911329239	laszloabraham@hotmail.com		0 %
126	MITARBEITER_ART	Aikawa	Rieko	Feldmuelgasse 19/25	A-1130 Wien	+4366473688092	riekoaikawa@hotmail.com		0 %
324	MITARBEITER_ART	Alcaide	Josefina	Breitenseerstrasse 40.21	1140 Wien	00351910288666	josefina.falcaide@gmail.com		0 %
166	MUSIKER	Angatscheva	Donka	Biberstrasse 8/9	1010 Wien				0 %
267	MUSIKER	Ansante	Walter	Spengergasse 26/23	1050 Wien				0 %
260	MUSIKER	Auner	Daniel	Ybbstrasse 16/5-6	1020 Wien	068110925832	info@danielauner.com		0 %
290	MITARBEITER_ART	Auner	Diethard	Franz Keimgasse 56/2	2345 Brunn am Gebirge				0 %
291	MITARBEITER_ART	Auner	Irina	Franz Keimgasse 56/2	2345 Brun am Gebirge				0 %
293	MITARBEITER_ART	Babaev	Roschel	Gertrude-Wondrack-Platz 4	1120 Wien				0 %
146	MUSIKER	Babaeva	Stella	Castellezgasse 14/7	1020 Wien				0 %
191	MITARBEITER_ART	Bátory	Piroska						0 %
196	MITARBEITER_ART	Baumgartner	Peter	Anningerstrasse 6	2371 Hinterbrühl	06764146734			0 %
215	MITARBEITER_ART	Becka	Ivan						0 %
320	MITARBEITER_ART	Benavides Diago	juan sebastian	stockhofstrasse 34	4020 Linz	06609013700	juansebastiandiago@gmail.com		0 %
77	MUSIKER	Benkö	Szabolcs	Mätyas k.					0 %
99	MITARBEITER_ART	Bentes	Claudio	Sechskrügelgasse 1/11	1030 Wien	019151790	claudio.bentes@mozarthaus.at		0 %
311	MITARBEITER_ART	Bernal-Montana	Nicolás	Lacknergasse 42/12	1170 Wien	0677 630 49689	nibemos@gmail.com		0 %
271	MITARBEITER_ART	Bernath	Orsolya	Kapos 31	1213 Budapest	^+36203380864	fborsika@gmai.com		0 %
209	MITARBEITER_ART	Bernhart	Stephanie	Lienfeldergasse 60c / 6	1160 Wien				0 %
277	MITARBEITER_ART	Binkowska	Natalia	Anton-Baumgartnerstraße 44/C4/1405	1230 Wien	06505113278			0 %
168	MITARBEITER_ART	Boala	Traian	Kandlgasse 7/11	Wien	015225597	traian_viola@yahoo.com		0 %
82	MUSIKER	Bolotny	Sergej	Emnelgasse 47/7	1050 Wien	0650431451			0 %
317	MITARBEITER_ART	Borges	Luis Fellipe de Oliveira	Gasgasse 2/1013	1150 Wien	069981175320	luisfellipeborges123 gmail.com		0 %
22	MUSIKER	Bratt	Maximilian	Neustiftgasse 93/9	1070 Wien	0699 12 58 33 61	maximilianbratt@hotmail.com		0 %
255	MITARBEITER_ART	Braun	Lisa	Obermüllnerstrasse 5/25	1020 wien	06801263022			0 %
240	MITARBEITER_ART	Breisach	Maud	Beckmanngasse 61/46	1140 Wien				0 %
188	MITARBEITER_ART	Breit	Edda	Rokitanskygasse 41/10	1170 Wien	069913158886	eddabreit@hotmail.com	ATU 60370967	13 %
90	MUSIKER	Bru	Ricardo	Rolandsberggasse 39	3400 klosterneuburg	06602511155, 02243 387 58	ricardo.bru@inode.at	58347667	13 %
47	MUSIKER	Bumbal	Tomas	Neulerchenfelderstrasse 58	1160 Wien	0660 810 10 99	tomasbumbal@hotmail.com		0 %
331	MUSIKER	Camila Cristina	Ribeiro Santos	Vorgartenstrasse 204/458	1020 Wien		camillacellista hotmail.com		0 %
194	MITARBEITER_ART	Casleanu	Sebastian						0 %
208	MITARBEITER_ART	Chantal	Prymka	ul. Kosciuszki 32/26	50-011 Wroclaw, Poland				0 %
53	MUSIKER	Chiorean	Sanda	Schweidlgasse 7/7	1020 Wien	069919188573	sanda_violin@yahoo.com		0 %
187	MITARBEITER_ART	Chiu	Yu-chen	Czerningasse 4/101	1020 Wien	069919089705			0 %
189	MITARBEITER_ART	Comploi	Philipp						0 %
341	MITARBEITER_ART	Cruz	Ever						0 %
63	MITARBEITER	Csanadi	Szilvia						0 %
332	MITARBEITER_ART	Csikar	Eniko	Almos Strasse 11 1/1	9023 Gyor	+36205359863	csikar.eniko82@gmail.com		0 %
93	MUSIKER	Csiszer	Imre	Rudolf Nurejew Promenade 5/17/1	1220 WIEN	06763106172			13 %
7	MUSIKER	Cuda	Rita	Unt.Augartenstr.44/13	1020 Wien	0699 19 74 13 90	ritacuda@yahoo.de	ATU69645048	13 %
148	MUSIKER	Czellecz	Ildiko	Hainburgerstrasse 24A/7	1030 Wien	+436764804250	czildee@gmail.com		0 %
50	MUSIKER	Daesun	Ko						0 %
342	MITARBEITER_ART	De Moraes Silva	Guilherme Afonso	Lastenstraße 26/6	5020 Salzburg	00436504496988	guilhermecello.gs@gmail.com		0 %
237	MUSIKER	Dekan	Anna	Weideckerstr. 14-21/10	3004 Riederberg				0 %
314	MITARBEITER_ART	Denneborg	Leonardo	Auhofstrasse 217-219, 1 , 3	1130 wien	06644617417	leonardo.denneborg1@gmail.com		0 %
102	MUSIKER	Dervenska	Valya	Beatrixgasse 12/47	1030 Wien	+43 676 4536722			0 %
127	MUSIKER	Dervenska	Valya	Dianagasse 4	1030 Wien	06764536722	valyadervenska@yahoo.com		0 %
151	MUSIKER	Descamps	Francois-Pierre	Mariannengasse 21/14	1090 Wien	+4369910432645	fp.descamps@chello.at		0 %
116	MITARBEITER_ART	Dickbauer	Johannes						0 %
309	MITARBEITER_ART	Dimitrova	Marina	Jahngasse 6/20	1050 wien	069918169591	marina.violin@abv.bg		0 %
229	MITARBEITER_ART	Dimov	Kamelia						0 %
300	MITARBEITER_ART	Dimov	Martin	Hietzinger Hauptstrasse 144/7	1130 WIen				0 %
139	MITARBEITER_ART	Dobreva	Desislava	Schuselkagasse 7/2	1150 Wien				0 %
164	MITARBEITER_ART	Dontcheva	Ralitza	Allerheiligenplatz 15/4-6	1200 Wien				0 %
244	MITARBEITER_ART	Dos Santos	Cicero	Dresdnerstrasse 128/13	1200 Wien	06504224993	cisantos@hotmail.com		0 %
284	MUSIKER	Dos Santos Gabriel		Dresdnerstrasse 128/13	1200 Wien				0 %
204	MITARBEITER_ART	Douylliez	Elise						0 %
285	MITARBEITER_ART	Drach	Stephanie	Veltlinerstrasse 1/5	2353 Guntramsdorf	+436605442133			0 %
282	MITARBEITER_ART	duffner	caroline	otto storchgasse 2-4/8/12	1210				0 %
283	MITARBEITER_ART	Duffner	Caroline	otto storchgasse 2-4/8/12	1210 Wien				0 %
167	MITARBEITER_ART	Dumitru	Rasvan	Kandlgasse 7/11	Wien	015225597	rasvan_dumitru@yahoo.com		0 %
130	MITARBEITER_ART	Ehrenfellner	Christoph						0 %
248	MUSIKER	Eichmeyer	Magdalena	Stadlbreiten 35/5	1220 Wien				0 %
198	MITARBEITER_ART	Encheva	Elisaveta	Lorenz Müller Gasse 1	1200 Wien	069913052247	elisavetaencheva@gmail.com		0 %
155	MITARBEITER_ART	Endelweber	Benedikt	Davidgasse 91-93/32	1100 Wien	069915582009			0 %
221	MUSIKER	Endelweber	Severin	Schlossberg 6	3500 Krems-Stein	0650 731 21 61	severin.endelweber@gmx.at		0 %
61	MUSIKER	Endre	Guran	Ganglbauerg. 20/1	1160 Wien				0 %
29	MUSIKER	Engel	Ulli						13 %
60	MITARBEITER	Engstler	Sonja	Sechsschimmelgasse 11/12	1090 Wien	0699/10770398	sonne110579@gmx.at		0 %
154	MITARBEITER_ART	Fassetta	Caterina	Hofmühlgasse 7A / 15	1060 Wien			ATU 49828307	13 %
28	MUSIKER	Fheodoroff	Thomas			0676 618 34 35	thomas.fheodoroff@utanet.at		13 %
202	MUSIKER	Filas	Stefan	Zohorska 31	90055 Lozorno - Slowakei				0 %
257	MITARBEITER_ART	Firsanova	Anna	Krieglergasse 6/13	1030 Wien	06765129746	annafirsanova@yandex.ru		0 %
10	MUSIKER	Flür	Richard	Maxergasse 3178	1030 Wien	0650 523 62 80	fluer@soundscape.at	ATU 568 83 867	13 %
222	MUSIKER	Fomina	Maria	Große Neugasse 5/4	1040 Wien				0 %
91	MUSIKER	Fónyad-Joó	Victoria	SDL Neugebäude 6/142	1110 Wien	0676/3751886			0 %
24	MUSIKER	Fortin	Wolfram	Cervantesgasse 5/19	1140 Wien	0699 11 85 04 29	wolframfortin@yahoo.de		0 %
41	MUSIKER	Frilingos	Alison	Stumpergasse 36/18	1060 Wien	0699 12 45 50 87			0 %
85	MUSIKER	Fritzsche	Gerda	Leitermayergasse 37/11	1180 Wien	0676 500 600 5	gerdafritzsche@mac.com	1303335	13 %
75	MUSIKER	Fuchs	Martin	Favoritensrt. 25/3/31	1040 Wien	0699 11080373			0 %
253	MUSIKER	Gahl	Annelie	Linzerstrasse 50/12	1140 Wien			088384474 ATU 580 44 315	0 %
259	MUSIKER	Galante	Barbara	Margaretenstrasse 23/28	1040 Wien			12780/7345 UID: ATU80855558	13 %
210	MUSIKER	Gansch	Sophie	Winbergergasse 14-16/1/12	1070 Wien				13 %
37	MUSIKER	Garia-Navas	Alfredo			0650 686 11 16			0 %
81	MUSIKER	Georgieva	Aya	Stolberggasse 13 / 20	1050 Wien	0676 690 30 82	aiageorgieva@hotmail.com		0 %
286	MUSIKER	Gerber	Anzel	Kolowratgasse 13	1100 Wien	+43 660 8354377	info@anzelgerber.com		0 %
264	MUSIKER	Gerkusov	Nikita	Am Modenapark 14-9	1030 Wien	00436641665181	nikitagerkusov@gmail.com		0 %
118	MUSIKER	Gimaletdinov	Nikolay	Mohgasse 28	1030 Wien	0699-10184633	nikolaygimaletdinov@hotmail.com		0 %
325	MITARBEITER_ART	gomes							0 %
326	MITARBEITER_ART	Gomes de Oliveira Sousa	Vinícius	Merianstrasse 10	5020 Salzburg	066764433146	gomesamadil1@hotmail.com		0 %
62	MUSIKER	Gospodinov	Peter	kleingasse 20/31	1030 wien	06645744103	peter.gospodinov@hotmail.com		0 %
38	MUSIKER	Grandpierre	Stephanie	mariengasse 4/2	2500 baden	06506363487	stephanie.grandpierre@hotmail.com		0 %
312	MITARBEITER_ART	Green	Robin	65 Cornerswell Road, Penarth, UK, Cf64 2UY		00447403448569	robg187@hotmail.com		0 %
66	MUSIKER	Groh	Ute	Hauptstrasse 18	2753 Ober-Piesting		grohute@gmx.at		0 %
217	MITARBEITER_ART	Grubinger	Sarah						0 %
97	MUSIKER	Guran	Endre	Wehrgasse 11/12	1050 Wien				0 %
21	MUSIKER	Hall	Lucia	Landstrasser 9/12	1030 Wien	0676 66 9999 8	luciahall@hotmail.com		0 %
272	MITARBEITER	Hartmann	Juliane	Nußdorfer Str 82/18	1090 Wien				0 %
113	MUSIKER	Hasenburger	Florian	Siebenbrunnengasse 55-57/13	1050 Wien	+436507666111	florianhasenburger@hotmail.com		0 %
335	MITARBEITER_ART	Hauer	Dominik	Lienfeldergasse 45	1160 Wien				0 %
278	MITARBEITER_ART	Hecher	Christina	Penzinger Strasse 33-37/916	1140 Wien				0 %
43	MUSIKER	Heger	Klaus	Schottenfeldgasse 24/7a	1070 Wien	0699 13 02 98 64	klaus.heger@chello.at	832/8290	0 %
11	MUSIKER	Heidrich	Werner	Lichtentalergasse 20/19	1090 Wien				0 %
136	MUSIKER	Heinzl	Karin	Gestettengasse 19/15	1030 Wien	0664 5970135	heinzl.karin@hotmail.com		0 %
145	MITARBEITER_ART	Herndler	Eva						0 %
176	MUSIKER	Heumesser	Kristina	Breitenfurterstr. 419/1/6	1230 Wien	+436641513958	kristina.heumesser@chello.at		0 %
6	MUSIKER	Hinterndorfer	Gerald	Gurkgasse 46/18	1140 Wien	069910205638	gerald.hinterndorfer@chello.at		0 %
306	MITARBEITER_ART	Hofbauer							0 %
42	MUSIKER	Hoisl	Eva	Singerstrasse 7	1010 Wien		konzerte@mozarthaus.at	123/344582	0 %
251	MITARBEITER_ART	Hoisl	Thomas	Mondscheingasse 17/10	1070 Wien				0 %
268	MITARBEITER_ART	Huber	Dora						0 %
141	MUSIKER	Hussein	Mahmoud	Operngasse 24.22	A-1040 Wien	06506235193	Violahussein@gmail.com		0 %
274	MITARBEITER_ART	Hussen	Liliane	Linke Wienzeile 128/16	1060 Wien	069910504978			0 %
200	MUSIKER	Huszar	Noemi	Jurekgasse 25/30	1150 Wien	06767452280			0 %
142	MUSIKER	Iberer	Robert			+4369919461644			0 %
110	MUSIKER	Illès	Klaudia	Vörösmarty STR. 17	9700 Szombiathely				0 %
56	MUSIKER	Ivanova	Daniela			0699 10 52 01 61			0 %
36	MUSIKER	Ivanova	Viktoria						0 %
95	MITARBEITER_ART	Jank	Lisbeth						0 %
172	MITARBEITER_ART	Juhasz	Eva						0 %
234	MUSIKER	Jurth	Gejza	Baumgasse 54/60	A-1030 Wien	+436604668650			0 %
153	MUSIKER	Kabut	Agnieszka	Braunhubergasse 25/2/6	1110 Wien	06769402610	agneskabut@hotmail.com		0 %
35	MUSIKER	Kaliyeva	Botagoz	Schelleingasse 36	1040 Wien	0699 11 24 00 29	botacello@hotmail.com		0 %
119	MITARBEITER_ART	Kàlnai	Peter	Zaunscherbgasse 4/303		+43 650 473 0258			0 %
319	MITARBEITER_ART	Kandashvili	Mikheil	Quellenstrasse 119	1100				0 %
84	MUSIKER	Kaniewska	Joanna	Johanesgasse 8	1010 Wien	0699 11 08 11 18			0 %
238	MITARBEITER_ART	Karvay	Dalibor						0 %
158	MITARBEITER_ART	Kim	Elias						0 %
14	MUSIKER	Kim	Julia Hannah	Universumstras.36/22	A-1200 Wien	06769391011	juliakim@live.at	03576/1444	0 %
40	MUSIKER	Kircher	Arne	Schwarzspanier Strasse 6/13	1090 Wien	0676 888 93 10 10	arne.kircher@chello.at	1613730	0 %
15	MUSIKER	Kircher	Axel	Salierigasse 12/4	1180 Wien	0676 941 59 69		ATU 518 95 203	0 %
298	MUSIKER	Kircher	Camilo	Lea 5	2831 Warth				0 %
1	MUSIKER	Kircher	Fritz	Laa 5	2831 Warth	0699 12 04 22 87	kircher.f@aon.at	ATU 47686507	13 %
340	MITARBEITER_ART	Knopp	Anna	Dr.Knoppstr.7	4694 Ohlsdorf	+436502945290	anna.violine02@gmx.at	53 123/9788	0 %
2	MUSIKER	Kocsis	Martin	Hauptstrasse 104	7452 Unterpullendorf	+43 664 917 84 84			0 %
242	MUSIKER	Kolarz-Lakenbacher	Sophie	Salvatargasse 3/21	1010 Wien	+436508142696	sophiekolarz@hotmail.com		0 %
261	MUSIKER	Kolozsvari	Gergö	Simmeringer Hauptstrasse 18-20	1110 Wien	+4369911441095			0 %
203	MUSIKER	Konrad	Barbara	Postgasse 2/1/1	1010 Wien	0650 4789511	bakon@aon.at	ATU 62299177	13 %
179	MUSIKER	Koscis	Stefan	Favoritenstr.119-1-11	1100 Wien				0 %
94	MITARBEITER_ART	Kossjanenko	Wladimir	Pressgasse 17/17	1040 Wien	069917038899	wladimir@violissimo.at	ATU 58927549	13 %
13	MUSIKER	Kouzmanova	Bojidara	Invalidenstr. 5/7	1030 Wien	0676 354 04 47	bojidarak@gmail.com		0 %
246	MITARBEITER_ART	Kovacic	Petra						0 %
182	MUSIKER	Krigovsky	Jan	Hviezdoslavova 44	90301 Senec - Slowakei	+436805017807			0 %
49	MUSIKER	Krisper	Florian	Glasergasse 5/1	1090 Wien	06503101649			0 %
88	MUSIKER	Kronick	Mara	Währingerstrasse 169/4/5	1180 Wien	0664 203 9383	marakronick@gmail.com	149/3308	0 %
3338	MITARBEITER_ART	Kropfitsch	Clemens	Walfischgasse	1010 Wien	06644572305	clemens.kropfitsch@gmail.com		0 %	Bearbeiten
205	MITARBEITER_ART	Kubitschek	Johannes						0 %	Bearbeiten
339	MUSIKER	Kuleba	KOSTIANTYN	Prinz-Eugen Straße 36/3/17	1040 Wien	+4366565765044	kostiamuzika@gmail.com		0 %	Bearbeiten
318	MITARBEITER_ART	Kuleba	Natalia	Prinz Eugen 36/3/17	1040 Wien	+6641621317	nataviola1509@ukr.net		0 %	Bearbeiten
225	MUSIKER	Körmendi	Veronika						0 %	Bearbeiten
89	MUSIKER	Lacorte	Jadenir						0 %	Bearbeiten
247	MITARBEITER_ART	Leitner	Gundula						0 %	Bearbeiten
287	MUSIKER	Lennertz Goncalves Penha	Gustavo	susi-nicoletti-weg 9/7	1100 Wien	067764047623	gustavolennertz@gmail.com		0 %	Bearbeiten
76	MUSIKER	Leopold	Niko	himmelpfortgasse 11/5	1010 Wien	06508701522	sualokin@gmx.at		0 %	Bearbeiten
310	MUSIKER	Lermer	Firmian	Grafenwies 1	5600 Henndorf		firmianl@aol.com		0 %	Bearbeiten
279	MITARBEITER_ART	Leyner - Wolf	Leonid	Hackhofergasse	1190 Wien	+436507429402	leonidn90@gmail.com		0 %	Bearbeiten
294	MITARBEITER_ART	Liculescu	Adela	Franzensgasse 16/13	1050 Wien	004369917010958	adelaliculescu@gmail.com		0 %	Bearbeiten
140	MITARBEITER_ART	Lindenthal	Wolfgang	Einsiedlergasse 24-2	1050 Wien	069915418007	wolfgang.lindenthal@chello.at	062/4140	0 %	Bearbeiten
149	MUSIKER	Lipov	Boris	Münzgasse 8/4	1030 Wien	069914214422			13 %	Bearbeiten
273	MUSIKER	Liu	Irini Xiaoya	Kleitsgasse 30/32	1030 Wien	069918397258			0 %	Bearbeiten
9	MUSIKER	Loghin	Mihai						0 %	Bearbeiten
245	MITARBEITER_ART	Louise Chisson							0 %	Bearbeiten
289	MITARBEITER_ART	Loulaki	Loukia	Ilkplatz 2/22	1020 Wien	06765513206	lloucello@gmail.com		0 %	Bearbeiten
228	MUSIKER	Luca	Ioana Mihaela	Strohgasse 12/17	1030 Wien	+436605335275			0 %	Bearbeiten
232	MITARBEITER_ART	Lukacs	Eva						0 %	Bearbeiten
236	MUSIKER	Makino	Kimi	Room 4, 20 Pine Road	M206UZ Manchester Didsbury England				0 %	Bearbeiten
213	MITARBEITER_ART	Mantler	Johannes						0 %	Bearbeiten
211	MUSIKER	Martin	Alfonso	Lerchenfelder Gürtel 36/17	1070 Wien				0 %	Bearbeiten
313	MITARBEITER_ART	Martin	Tenev	Erndtgasse 34-36 Stiege 3 Tür 12	1180 Wien				0 %	Bearbeiten
328	MUSIKER	MEDLAM	Lukas	Kettenbrückengasse 4	1040 wien	069919021080	Lukas_medlam@hotmail.com	044001022	13 %	Bearbeiten
104	MUSIKER	Merei	Tamas	Öntö 42	9700 H-Ungarn	36-20/2202040	tamasmerei@hotmail.com		0 %	Bearbeiten
297	MUSIKER	Mihaly Norbert	Simo	Friedrich Kaiser Gasse 100/4	1160 Wien	+43 660 6778964	simonorbert98@gmail.com		0 %	Bearbeiten
134	MITARBEITER_ART	Miklin	Ines	Mommsengasse 23/18	1040 Wien	0650/9208901	ines.miklin@chello.at		0 %	Bearbeiten
25	MUSIKER	Miteva	Teodora	Oberer Kirchberg 83	7100 Neusiedl am See	0676 432 00 54	tmiteva@hotmail.com		0 %	Bearbeiten
52	MUSIKER	Mittendorfer	Annette			069910210831		violine	0 %	Bearbeiten
308	MUSIKER	Molina Brasil	Abner	Simmeringer Hauptstraße 54/24a	1110				0 %	Bearbeiten
270	MITARBEITER_ART	Molnar	Piroska	Temeto utca 48	2097 Pilisborosjeno	+36304171697			0 %	Bearbeiten
269	MITARBEITER_ART	More	Laszlo	Krisztina krt. 31-33	1122 Budapest	+36302124119			0 %	Bearbeiten
231	MITARBEITER_ART	Moreira	Andrea	Johannes Filzerstrasse 10	5020 Salzburg				0 %	Bearbeiten
239	MITARBEITER_ART	Moriyama	Tomo	Münzgasse 3/49	1030 Wien	+4369917486505	tomo.viola.12.14@gmail.com		0 %	Bearbeiten
175	MITARBEITER_ART	Moser	Daniel	Steingasse 36/17	1030 Wien	0699 171 961 68	moserd@gmx.at		0 %	Bearbeiten
111	MUSIKER	Mosetti	Sara	Friedmanngasse 55/11	1160 Wien	+436508128944	sara.mosetti@gmx.at		0 %	Bearbeiten
336	MUSIKER	Moura Gomes santos	Hanan Syllas	Castelleszgasse 16 top 1	1020 Wien	+4366064195521	hamoug@gmail.com		0 %	Bearbeiten
186	MUSIKER	Muraru	Georgiana	Schelleingasse 36/312	1040 Wien	+436765692552	giocoso.sq@gmail.com		0 %	Bearbeiten
5	MUSIKER	Musiker 1	Musiker 1						0 %	Bearbeiten
144	MUSIKER	Musiker 2	Musiker 2						0 %	Bearbeiten
157	MUSIKER	Musiker 3	Musiker 3						0 %	Bearbeiten
173	MUSIKER	Musiker 4	Musiker 4						0 %	Bearbeiten
18	MUSIKER	Nagy	Zsuzsa	Homoktövis Str. 10	9200 Movär	00 36 20 9213894		8363523224	-20 %	Bearbeiten
48	MUSIKER	Nakamura	Makiko	Kurzgasse 3/6	1060 Wien	0699 12319 621	makkovn@gmail.com		0 %	Bearbeiten
214	MITARBEITER_ART	Nederost	Luboslav						0 %	Bearbeiten
128	MUSIKER	Nedyalkova	Dima	Petrusgasse 16/2	1030 Wien	0660 7338515	dima.nedyalkova@gmail.com		0 %	Bearbeiten
19	MUSIKER	Nemeth	Gusztav	Öreg Str.- 14	9084 Györsag	00 36 96 414 880	nepo@citromail.hu	8324613188	-20 %	Bearbeiten
64	MUSIKER	Nemeth	Mathias						-20 %	Bearbeiten
17	MUSIKER	Nemeth Pongracz	Judith	Öreg Str. 14	9084 Györsag	00 36 96 414 880	nepo@citromail.hu	8326673773	-20 %	Bearbeiten
44	MUSIKER	Nenescu	Cristian	Römerweg 12	2403 Wildungsmauer	0664 22 42 573	Cristian_Nenescu@gmx.at		0 %	Bearbeiten
4	MUSIKER	New	Nikolai	Amtshausg. 8/24	1050 Wien	0664 135 81 65	haydn.quartett@aon.at		0 %	Bearbeiten
162	MUSIKER	Ni	Xuan	Kolschitzkyg.14	1040 Wien	06767705187	nistring@hotmail.com		0 %	Bearbeiten
263	MITARBEITER_ART	Nikita	Gerkusov	Witthauergasse 17-3a	1180 Wien	+352691381997	nikiitagerkusov@gmail.com		0 %	Bearbeiten
122	MITARBEITER_ART	Nimanaj	Astrit	Hegergasse 3/17	1030 Wien				0 %	Bearbeiten
254	MUSIKER	Niskanen	Irma	Löwengasse 49/14	1030 Wien				0 %	Bearbeiten
27	MUSIKER	Nogic	Zoran	Münzgasse 3/26	1030 Wien	0676 417 9015			0 %	Bearbeiten
55	MITARBEITER	Nutz	Markus	Schönbrunner Straße 48	1050 Wien	0676 4 083 084	nutz@compact-solutions.at	1234X3221	20 %	Bearbeiten
265	MITARBEITER_ART	Obereigner	Ulla						0 %	Bearbeiten
109	MITARBEITER_ART	Obritzhauser	Andrea	Schönbrunnerstraße 283/17	1120 Wien	0676/7809469	obritzhauserandrea@hotmail.com		0 %	Bearbeiten
78	MITARBEITER_ART	Oczkowska	Marianna						0 %	Bearbeiten
235	MUSIKER	Okubo	Kei	Salesianergasse 15/15	1030 Wien				0 %	Bearbeiten
3	MUSIKER	Olthoff	Gerswind	Laa 5	2831 Warth	0699 11 75 24 63	Kircher.gerswind@aon.at		0 %	Bearbeiten
220	MITARBEITER_ART	Omastova	Silvia	Boerhaavegasse 8a/1/2.01	1030 Wien	06769004784			0 %	Bearbeiten
160	MUSIKER	Orininskiy	Nikolay	steingasse 16,19	1030 Wien	06502703813	orininsky@hotmail.com		0 %	Bearbeiten
115	MUSIKER	Páll	Levente	Tanbruckgasse 8/14-15	1120 Wien	0699 10197246	pall.levente@gmail.com		0 %	Bearbeiten
51	MUSIKER	Palma	Barbara	Oberzellergasse 18/14	1030 wien	0699/11462362	barbara.palma@gmx.at	61134329	13 %	Bearbeiten
256	MUSIKER	Pálsson	Ernir Óskar	Salesianergasse 15/15	1030 Wien	06801102880	ernirpalsson@gmail.com		0 %	Bearbeiten
193	MUSIKER	Panfili	Rusanda	Hegergasse 4/15	1030 Wien	069919880111	rusanda.panfili@gmail.com		0 %	Bearbeiten
23	MUSIKER	Pasztor	Attila	Hadikgasse 72/2/3	1140 Wien	06767238528			13 %	Bearbeiten
150	MUSIKER	Pasztor	Eliza	Hadikgasse 72/2/3	1140 Wien	06769336621	eliza.fluder@gmx.at		0 %	Bearbeiten
206	MITARBEITER_ART	Patrnciak	Rudolf	A.F.Kolára 205	01306 Terchová				0 %	Bearbeiten
288	MITARBEITER_ART	Pavlo	Kachnov	Linke Wienzeile 94	1060 Wien	06641836479	kachnov.pavel@gmail.com		0 %	Bearbeiten
114	MUSIKER	Pennetzdorfer	David						0 %	Bearbeiten
129	MITARBEITER_ART	Pennetzdorfer	Johannes						0 %	Bearbeiten
233	MUSIKER	Pennetzdorfer	Simon	Münzgasse 3	1030				0 %	Bearbeiten
96	MITARBEITER_ART	Petitet-Kircher	Beatrice						0 %	Bearbeiten
46	MUSIKER	Peyrer	Gerhard	Glassergasse 5/17	1090 Wien	01 319 86 94	floete@gerhardpeyrer.at	ATU 56392424	13 %	Bearbeiten
135	MITARBEITER_ART	Pfleger	Alfred						0 %	Bearbeiten
305	MITARBEITER_ART	Pietrowskaja	Aliona	Lechnerstrasse 6/5	1030 Wien	069919768881	msalionak@gmail.com	03 656/9044	0 %	Bearbeiten
224	MUSIKER	Pistofidis	Panteleimon	Schrottgasse 4/12	A-1030 Wien				0 %	Bearbeiten
330	MITARBEITER_ART	Potulska	Marta	Salesianergasse 8/3/25	1030 Wien	069917095801	potulskamarta@gmail.com		0 %	Bearbeiten
302	MUSIKER	pranskute	ieva	bechardgasse 11-3	1030 wien		pranskute.ieva@gmail.com		0 %	Bearbeiten
74	MUSIKER	Preimesberger	Philip						0 %	Bearbeiten
216	MITARBEITER_ART	Prievoznik	Jan						0 %	Bearbeiten
123	MITARBEITER_ART	Ràc	Gàbor						0 %	Bearbeiten
321	MITARBEITER_ART	raljic	Jovana	Altebergenstrasse 2e/2//6	1140 wien	06508635681	jovana.raljic@hotmail.com		0 %	Bearbeiten
159	MITARBEITER_ART	Ramalho	Amarilio	Märzstrasse 76	1150 Wien	069919442074	amarilio.sr@gmail.com		0 %	Bearbeiten
131	MITARBEITER_ART	Ramos	Samuel	Ottagringer Strasse 20/1/11	1160 Wien	+43 650 676 14 31			0 %	Bearbeiten
303	MITARBEITER_ART	ranskute	pranskute	bechardgasse 11-3	1030 wien		pranskute.ieva@gmail.com		0 %	Bearbeiten
304	MITARBEITER_ART	ranskute	pranskute	bechardgasse 11-3	1030 wien		pranskute.ieva@gmail.com		0 %	Bearbeiten
34	MUSIKER	Rath	Lukas						0 %	Bearbeiten
199	MUSIKER	Reining	Martin	Wohllebengasse 15/7	1040 Wien	06502200381	martinreining@gmail.com		0 %	Bearbeiten
201	MUSIKER	Reiss	Sebastian	Broschgasse 328	2014 Breitenwaida	06801147445			0 %	Bearbeiten
243	MUSIKER	Reitmaier	Simon	Weinzierlgasse 9-11	1140 Wien				0 %	Bearbeiten
80	MUSIKER	Rieser	Fabian	Mittersteig 15/4/24	1040 Wien	06766459374			0 %	Bearbeiten
117	MUSIKER	Roczek	Saskia	Goldeggasse 5/12	A-1040 Wien				0 %	Bearbeiten
230	MUSIKER	Rodionova	Lisa	Boerhaavegasse 23/8	1030 Wien	+4369917055862			0 %	Bearbeiten
207	MITARBEITER_ART	Romana	Uhlikova	Stefanovicova 104	951 15 Mojmirovce				0 %	Bearbeiten
73	MUSIKER	Romanoff- Schwarzberg	Nora	Argentiniertsr. 48/7	1040 Wien	06766533658	nora_schwarzberg@hotmail.com		0 %	Bearbeiten
212	MITARBEITER_ART	Rotaru	Felix - Daniel						0 %	Bearbeiten
322	MITARBEITER_ART	Rubanova	Alisa	Gartengasse 20 / 6	1050 Wien				0 %	Bearbeiten
275	MITARBEITER_ART	rubanova	julia	albrechtsrasse 99	3400 Klosterneuburg	06804403821	juliarubanova1@gmail.com		0 %	Bearbeiten
32	MUSIKER	Ruol	Saverio						0 %	Bearbeiten
190	MITARBEITER_ART	Ruscior	Christian						0 %	Bearbeiten
92	MUSIKER	Sabia Quartett		Johannes Filzerstr. 10	5020 Salzburg				0 %	Bearbeiten
219	MITARBEITER	Sagir	Tuncay	Hofmannstalgasse 12	1030 Wien				0 %	Bearbeiten
121	MITARBEITER_ART	Samimi	Younes	Wimmergasse 4/4	1050 Wien	+43 664 37 80 109			0 %	Bearbeiten
301	MITARBEITER_ART	scala	santo	mehlplatz 1	8010 graz	067764347139			0 %	Bearbeiten
163	MITARBEITER_ART	Schadauer	Christina	Lazarettgasse 30/21	1090 Wien	0664/2803613	Christinaschadauer@gmx.at		0 %	Bearbeiten
108	MUSIKER	Schawarz	Barbara	Dornbacherstr 64/1	1170 Wien	069910169082	barbaraschawarz@hotmail		0 %	Bearbeiten
250	MUSIKER	Schebesta	Nicole	Wiedner Hauptstrasse 40/1/12	1040 Wien				0 %	Bearbeiten
197	MITARBEITER_ART	Schmetterer	Elisabeth	Simmeringer Hauptstraße 205/3/4	1110 Wien	0664/5253873			0 %	Bearbeiten
258	MITARBEITER_ART	Schmidt	Eliza	Ackergasse 15	2442 Unterwaltersdorf	+43 664 343 6659			0 %	Bearbeiten
12	MUSIKER	Schmölz	Markus	Witthauergasse 32/1	1180 Wien				0 %	Bearbeiten
156	MITARBEITER_ART	Schorn	Mariella	Mohsgasse 28	1030 Wien	0650/8534906	mariella.schorn@sbg.at		0 %	Bearbeiten
266	MITARBEITER_ART	Schwartz	Balazs						13 %	Bearbeiten
86	MUSIKER	Schöfmann	Ele	Rubingasse 34	1210 Wien	0676 625 66 03	ele.schoefmann@gmx.at	Cello	0 %	Bearbeiten
31	MUSIKER	Schönwiese	Dorothea						13 %	Bearbeiten
276	MITARBEITER_ART	SCHÖTTLE	RUPERT	OOTO BAUER GASSE 15/17	1060 Wien	0664 346 0 336	rupert.schoettle@inode.at	Cello	0 %	Bearbeiten
241	MUSIKER	Scripcaru	Ion	Dietrichgasse 31/26	1030 Wien				0 %	Bearbeiten
132	MITARBEITER_ART	Sekulski	Witold	Max Winter Platz 22/30	1020 Wien				0 %	Bearbeiten
107	MUSIKER	Sipos	Cecilia	Rennweg 38/10	1030 Wien	0699 12740655	cecilia.sipos@chello.at		13 %	Bearbeiten
45	MUSIKER	Skarnes	Odil						0 %	Bearbeiten
334	MITARBEITER_ART	Skovliuk	Anastasiia	Weißgerberlände 40/8a	1030 Wien	+4368181268950	skovluk.a@icloud.com		0 %	Bearbeiten
70	MUSIKER	Skweres	Piotr	Rosasgasse 26/12/8	1120 Wien		piotr.skweres@yahoo.com		0 %	Bearbeiten
133	MUSIKER	Skweres	Tomasz	Leibnitzgasse 5/4	1100 Wien	+43 650 809 10 14			0 %	Bearbeiten
137	MITARBEITER_ART	Snyman	Michael						0 %	Bearbeiten
181	MUSIKER	Sonnleitner	Gerlinde	Kleine Neugasse 11/5	1050 Wien			267/8359	13 %	Bearbeiten
180	MITARBEITER_ART	Sorokow	Alexandr	Keplerplatz 4/14	1100 Wien	06765952557	mosc.sasha@gmail.com		0 %	Bearbeiten
315	MITARBEITER_ART	sousa							0 %	Bearbeiten
249	MITARBEITER_ART	Spalt-Campbell	Veronika	Salmgasse 14/1	1030 Wien	06765718278			0 %	Bearbeiten
280	MITARBEITER_ART	Spasov	Rami	Erndtgasse 34-36/3/11	1180 Wien	+436802224477	rami_phy@yahoo.de		0 %	Bearbeiten
184	MITARBEITER_ART	Spatarelu	Alexandru Florin	schelleingasse 36/311	1040 Wien		giocoso.sq@yahoo.com		0 %	Bearbeiten
33	MUSIKER	Spindler	Roland	Reiprechtsdorferstrasse 18/37	1050 Wien	06648329186			0 %	Bearbeiten
292	MITARBEITER_ART	Squizzato	Gabriel	Rechte Wienzeile, 21/19	1040 Wien	+4367762742850	gabriel.iscuissati@hotmail.com		0 %	Bearbeiten
295	MUSIKER	Sretovic	Dusan	Beheimgasse 40/4b	1170 Wien	+436677939077	dusansretovic@gmail.com	23 323/4269	0 %	Bearbeiten
327	MUSIKER	Stampf	Keiko	hema					-20 %	Bearbeiten
20	MUSIKER	Stampf	Sandor	Hema U. 16	9082 Nyul	00 36 20 4917351	stampfs@hotmail.com	8399224871	-20 %	Bearbeiten
185	MUSIKER	Stanciu	Adrian	Schelleingasse 36/312	1040 Wien	069910741312	adrian_stanc1u@yahoo.com		0 %	Bearbeiten
106	MUSIKER	Steiner	Ferdinand	Johann Wolf Strasse 4 / 1	5020 Salzburg		f.steiner@xlink.at	048 / 7826	13 %	Bearbeiten
323	MUSIKER	Steiner	Judith	Seeallee 62	3481 Thürnthal				13 %	Bearbeiten
8	MUSIKER	Steiner & Mössmer GnbR.	WienerKlassikQuartett /	Seeallee 62	3481 Thürnthal			ATU 65089717	13 %	Bearbeiten
178	MITARBEITER_ART	Stephan	Kosic						0 %	Bearbeiten
105	MUSIKER	Stuller	Geza	Petöfi 11	9725 Cak	36-94/364290	g.stuller@gmx.at		0 %	Bearbeiten
227	MUSIKER	Sult	Vasile	Strohgasse 12/17	1030 Wien	+436605335275	nicu.sulti@gmail.com		0 %	Bearbeiten
65	MUSIKER	Sulzgruber	Rainer			0650 88 777 20			0 %	Bearbeiten
195	MUSIKER	Summerder	Johanna	theresiannugasse 14/2	1040 Wien	06508158565	j.s.violon@gmx.net		0 %	Bearbeiten
69	MUSIKER	Szumiel	Piotr						0 %	Bearbeiten
174	MUSIKER	Takenaka	Noriko	Wohllebengasse3/2/4	1040 Wien	06604953620			0 %	Bearbeiten
112	MUSIKER	Takeuchi	Tokio	Linke Wienzeile 272/27	1150 Wien				0 %	Bearbeiten
165	MUSIKER	Tamisier	Anais	Belvederegasse 34/4	1040 Wien	00436765144702	anais_tamisier@yahoo.fr		0 %	Bearbeiten
262	MITARBEITER_ART	Tenev	Martin	Erndtgasse 34-36/3/12	1180 Wien	06764369460	mttenev@windowslive.com		0 %	Bearbeiten
152	MUSIKER	Ternes	Gloria	Pichlergasse 2/11	1090 Wien	069911275996			0 %	Bearbeiten
183	MUSIKER	Todica	Teofil	Scheleingasse 36/311	1040 Wien	069910741312			0 %	Bearbeiten
218	MUSIKER	Topalovic	Ana	Matthäusgasse 12/11	1030 Wien				0 %	Bearbeiten
26	MUSIKER	Torchinsky	Dimitri	Sechshauserstrasse 11/17	1150 Wien	06764311779	dimtorch@hotmail.com		0 %	Bearbeiten
124	MUSIKER	Trabesinger	Michael	Florianigasse 17/10	1080 WIen	069911950118	michael.trabesinger@gmx.at		0 %	Bearbeiten
192	MITARBEITER_ART	Treflinger	Peter						0 %	Bearbeiten
169	MUSIKER	Török	Ana	Kandlgasse 7/2/11	1070 Wien	06508725562	bogati_anna@yahoo.com		0 %	Bearbeiten
170	MITARBEITER_ART	Török	Zsolt	Kandlgasse 7/2/11	1070 Wien	06508725564	torokzsolt84@yahoo.com		0 %	Bearbeiten
337	MITARBEITER_ART	Ulianchenko	Dmytro	Kölblgasse 32/12	1030 wien	+43 664 278 85 58	dmi_ul@ukr.net		0 %	Bearbeiten
281	MITARBEITER_ART	Ulma-Lechner	Katarzyna	Brünner Strasse 2-4/18	1210 Wien	06503705383	katarzyna.ulma@gmail.com		0 %	Bearbeiten
307	MITARBEITER_ART	Ulu	Eda	Kaisermühlenstraße 14	1220 Wien				0 %	Bearbeiten
67	MUSIKER	Unterberger	Christof	Wihgae 8/6	1160 Wien	0699 19 57 91 88	christof@chistof.unterberger.com		0 %	Bearbeiten
120	MITARBEITER_ART	Varosyan	Artyom	Schelleingasse 36/309	1040 Wien	+43 676 421 8282			0 %	Bearbeiten
100	MUSIKER	Vass	Kinga	Johannesgasse 25/1/5	2500 Baden	+436648491289			0 %	Bearbeiten
296	MUSIKER	Vilaca Pinho	Caputo Marina	Susi Nicoletti Weg	1100 Wien	067764383965	mcaputo30@gmail.com		0 %	Bearbeiten
103	MUSIKER	Vujic	Vida	Wurlitzergasse 41/5	1160 Wien	06801281663			0 %	Bearbeiten
59	MUSIKER	Wally	Thomas	Pulverturmgasse 1/5/14	1090 Wien	06508138614	wallythomas@gmx.at		13 %	Bearbeiten
98	MUSIKER	Wang-Yu	Ko	Blindengasse 7-9	1080 Wien				0 %	Bearbeiten
83	MUSIKER	Westcombe-Evans	Lydia	Einsiedlerplatz 10/9	1050 Wien	0699 11 58 99 24			0 %	Bearbeiten
72	MUSIKER	Westenberger	Rafael	Wimmergasse 33/15	1050 Wien	0650 651 650 5	rafwes@gmail.net		0 %	Bearbeiten
177	MUSIKER	Wild	Angelika	Linzerstraße 28	3003 Gablitz			ATU 59716659	13 %	Bearbeiten
252	MUSIKER	Wimmer	Angelika	Hofgasse 5/7A	1050 Wien	06502664444	angi_wimmer@hotmail.com		0 %	Bearbeiten
30	MUSIKER	Wincor	Ilse						13 %	Bearbeiten
87	MUSIKER	Wurnitsch	Barbara	Lambrechtgasse 5/8	1040 Wien	0664 88421133, 0699 15 50 68 5	Wurnitsch@gmail.com		13 %	Bearbeiten
101	MITARBEITER_ART	Wutschek	Andrea						0 %	Bearbeiten
143	MITARBEITER_ART	Yablaska	Iva						0 %	Bearbeiten
71	MUSIKER	Zádory	Édua	Wimmergasse 10/1	1050 Wien	0699 19021060	violine@eduazadory.com	ATU57374512	0 %	Bearbeiten
161	MITARBEITER_ART	Zagorova	Ekaterina	Meidlinger Hauptstraße 77-79/2/15	1120 Wien	069918192627	zagorova.ekaterina@hotmail.com		0 %	Bearbeiten
333	MITARBEITER_ART	Zakharov	Mykhaylo	Hoffeld 28	2870 Aspang	06607333333	mnzakharov@yahoo.com		0 %	Bearbeiten
68	MITARBEITER_ART	Zalejski	Pawel						0 %	Bearbeiten
226	MUSIKER	Zelenin	Konstantin	Am Florahof 5	A-3425 Langenlebarn	+436504834933	konstantin.zelenin@gmail.com		0 %	Bearbeiten
329	MUSIKER	Zelenin Rückzahlung für Dezember 24							0 %	Bearbeiten
125	MITARBEITER_ART	Ziervogel	Benedict						0 %	Bearbeiten
147	MUSIKER	Ziervogel	Mihoko	Dapontegasse 13/5	1030 Wien	+43664884107137			0 %	Bearbeiten
138	MITARBEITER_ART	Ziska	Daniel	Sapossigasse 52	1200 Wien				0 %	Bearbeiten
39	MUSIKER	Zmrzlik	Clara						0 %	Bearbeiten
223	MUSIKER	Znamensky	Alexander	Landstraßergürtel 9/9	A-1030 Wien	+4369911926441	alexander.znamenskiy@gmail.com		0 %	Bearbeiten
16	MUSIKER	Zorita	Luis	Linzerstrasse 123/9	1140 Wien				0 %	Bearbeiten`;

function slugify(text: string) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '_')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function runMusikerImport() {
  console.log('Starting Musiker/Mitarbeiter Import...');
  const lines = rawData.trim().split('\n');
  
  const parsedData = lines.map(line => {
    const cols = line.split('\t');
    
    // Fallback gracefully if some columns are missing
    const artRaw = cols[1] || '';
    const nachname = (cols[2] || '').trim();
    const vorname = (cols[3] || '').trim();
    const strasse = (cols[4] || '').trim();
    const plzOrtRaw = (cols[5] || '').trim();
    const telefon = (cols[6] || '').trim();
    const email = (cols[7] || '').trim();
    const steuernummer = (cols[8] || '').trim();
    const steuersatzRaw = (cols[9] || '').trim();

    // Map Art
    let art = 'Musiker';
    if (artRaw.includes('MITARBEITER')) {
      art = 'Mitarbeiter';
    } else if (artRaw.includes('PARTNER')) {
      art = 'Partner';
    }

    // Split PLZ and Ort
    const firstSpaceIndex = plzOrtRaw.indexOf(' ');
    let plz = '';
    let ort = plzOrtRaw;
    if (firstSpaceIndex > 0) {
      if (!isNaN(Number(plzOrtRaw.substring(0, firstSpaceIndex)))) {
         plz = plzOrtRaw.substring(0, firstSpaceIndex);
         ort = plzOrtRaw.substring(firstSpaceIndex + 1).trim();
      } else {
        // Only valid if PLZ starts with number
        // Just extract numbers at start
        const match = plzOrtRaw.match(/^(\d+)\s*(.*)/);
        if (match) {
            plz = match[1];
            ort = match[2];
        } else if (plzOrtRaw === '1060' || !isNaN(Number(plzOrtRaw))) {
            plz = plzOrtRaw;
            ort = 'Wien';
        }
      }
    } else if (!isNaN(Number(plzOrtRaw)) && plzOrtRaw.length > 0) {
      plz = plzOrtRaw;
      ort = 'Wien'; // Best guess for standing alone zip like 1060
    }

    // Parse Steuersatz
    let steuersatz = 0;
    if (steuersatzRaw) {
      const numericString = steuersatzRaw.replace('%', '').trim().replace(',', '.');
      const parsed = parseFloat(numericString);
      if (!isNaN(parsed)) steuersatz = parsed;
    }

    // Generate ID
    const namePart = slugify(`${vorname} ${nachname}`);
    const id = namePart ? `musiker_${namePart}` : `musiker_unknown_${Math.random().toString(36).substring(7)}`;

    return {
      id,
      data: {
        art,
        nachname,
        vorname,
        strasse,
        plz,
        ort,
        telefon,
        email,
        steuernummer,
        steuersatz
      }
    };
  });

  console.log(`Parsed ${parsedData.length} records. Preparing batch upload...`);

  // Max batch size is 500
  const chunks = [];
  for (let i = 0; i < parsedData.length; i += 500) {
    chunks.push(parsedData.slice(i, i + 500));
  }

  for (let i = 0; i < chunks.length; i++) {
    const batch = writeBatch(db);
    for (const record of chunks[i]) {
      const docRef = doc(db, `apps/${APP_ID}/musiker`, record.id);
      batch.set(docRef, record.data);
    }
    await batch.commit();
    console.log(`Uploaded batch ${i + 1} of ${chunks.length}`);
  }

  console.log('Import successfully completed!');
}
