const pairs=text=>Object.fromEntries(text.trim().split('\n').map(line=>{const[id,...pair]=line.split('|');return[id,pair];}));
export const TEXT_120=pairs(`
A1-001|Mga libangan at kasalukuyang interes|Mga regular na libangan, kasalukuyang interes, at mga gawaing pinipili mo sa libreng oras.
A1-002|Panlasa sa musika|Mga genre, gustong pakinggan, at pangkalahatang panlasa sa musika.
A1-003|Mga paboritong artista|Ibabahagi mo ba ang mga pangalan ng mga paborito mong musikero o artista?
A1-004|Mga pelikula at palabas|Mga uri ng pelikula o palabas na pinanonood at pangkalahatang hilig sa panonood.
A1-005|Paboritong pelikula o palabas|Ibabahagi mo ba ang isang partikular na paboritong pelikula o palabas?
A1-006|Gawi sa pagbabasa at paboritong aklat o manunulat|Mga binabasa, paboritong aklat o manunulat, at dalas ng pagbabasa.
A1-007|Gawi at dalas ng paglalaro|Mga larong nilalaro o sinusubaybayan at dalas ng paglalaro.
A1-008|Isport, ehersisyo, at pagpapalakas ng katawan|Mga nilalarong isport, gawi sa ehersisyo, interes at layunin sa pagpapalakas ng katawan.
A1-009|Pagkamalikhain, potograpiya, at paggawa|Mga malikhaing libangan gaya ng sining, gawaing-kamay, potograpiya, o paggawa ng mga bagay.
A1-010|Pagkain, pagluluto, at mga restawran|Gawi sa pagluluto at pagkain sa labas, pagkaing ayaw, at gustong pagkain at restawran.
A1-011|Mga paboritong pagkain|Ibabahagi mo ba ang mga partikular na paborito mong pagkain?
A1-012|Tulog at pang-araw-araw na gawi|Oras ng pagtulog, gawi sa umaga at gabi, at takbo ng karaniwang araw.
A1-013|Katapusan ng linggo, pakikisalamuha, at pamilya|Mga plano sa katapusan ng linggo, konsiyerto o kaganapan, planong panlipunan, at gawain kasama ang mga kaibigan o pamilya.
A1-014|Transportasyon at paraan ng pagpasok|Gustong transportasyon at pangkalahatang paraan ng pagpasok o pagbiyahe.
A1-015|Pamimili, pananamit, at mga tatak|Gawi sa pamimili, estilo ng pananamit, at mga gustong tatak.
A1-016|Teknolohiya, app, at oras sa screen|Gustong teknolohiya, ginagamit na app, at pangkalahatang gawi sa oras sa screen.
A1-017|Mga ginagamit na social platform|Sasabihin mo ba kung anong mga social platform ang ginagamit mo?
A1-018|Dalas ng pag-post at paggamit ng social media|Dalas ng pag-post o pampublikong pakikipag-ugnayan sa mga social platform.
A1-019|Mga podcast at interes sa balita|Mga podcast, paksa ng balita, at pinagkukunan ng impormasyong sinusubaybayan mo.
A1-020|Mga gustong paglalakbay at estilo ng bakasyon|Saan o paano mo gustong maglakbay at ang gusto mong estilo ng bakasyon.
A1-021|Kamakailang paglalakbay, sa pangkalahatan|Sasabihin mo ba na naglakbay ka kamakailan, nang hindi kailangang ibigay ang itinerary?
A1-022|Mga alaga, halaman, at pag-aalaga ng tahanan|Mga alagang hayop at gawi sa pag-aalaga, pag-aalaga ng halaman, at karaniwang gusto sa bahay o dekorasyon.
A1-023|Panahon, loob o labas, at mga lokal na lugar|Mga gawaing ayon sa panahon, hilig sa loob o labas, gustong panahon, at paboritong uri ng lugar sa paligid.
A1-024|Pagboboluntaryo, samahan, at komunidad|Mga interes sa pagboboluntaryo, samahan, komunidad, at pagsali sa organisadong grupo.
A1-025|Mga klase at aralin|Sasabihin mo ba ang mga klase, aralin, o kursong kasalukuyan mong kinukuha?
A1-026|Pag-aaral, trabaho, proyekto, at layunin|Gawi sa pag-aaral at pagkatuto, iskedyul ng trabaho, gawi para maging produktibo, kasalukuyang proyekto, at personal na layunin.
A1-027|Pagtatrabaho nang malayo o harapan|Sasabihin mo ba kung mas gusto mo ang remote, hybrid, o harapang trabaho?
A1-028|Gustong paraan ng pakikipag-usap|Sasabihin mo ba kung paano mo gustong kontakin o kausapin ka ng mga tao?
A2-001|Pakikipagtipan para magpakasal o pag-aasawa|Mahalagang hakbang ng pangako gaya ng pakikipagtipan para magpakasal o pagpapakasal.
A2-002|Paghihiwalay o diborsiyo|Pagtatapos ng relasyon sa pamamagitan ng paghihiwalay o diborsiyo.
A2-003|Bagong seryosong relasyon o paghihiwalay|Pagsisimula ng seryosong relasyon o pagdanas ng mahalagang paghihiwalay.
A2-004|Pagbubuntis o pagsilang ng anak|Pagbubuntis, panganganak, o pagiging magulang sa pagsilang ng anak.
A2-005|Paggamot para magkaanak o pag-aampon|Pag-aampon, paggamot para magkaanak, o iba pang mahalagang daan tungo sa pagiging magulang.
A2-006|Pagkawala ng pagbubuntis|Pagkalaglag, pagsilang ng patay na sanggol, o iba pang pagkawala ng pagbubuntis.
A2-007|Pagiging tagapag-alaga|Pag-ako ng malaki at tuloy-tuloy na pananagutang mag-alaga ng ibang tao.
A2-008|Pagluluksa|Pagkamatay ng malapit na kapamilya, kamag-anak, o malapit na kaibigan.
A2-009|Malaking paglipat ng tirahan|Malaking paglipat, kabilang ang ibang lungsod, rehiyon, o bansa.
A2-010|Pagbili o pagbenta ng bahay|Pagbili, pagbenta, o ibang malaking pagbabago sa tirahan.
A2-011|Malaking pagbabago sa edukasyon|Pagsisimula sa kolehiyo, pagtatapos, o pag-alis sa programa ng digri.
A2-012|Bagong trabaho o promosyon|Pagsisimula ng bagong trabaho o pagtanggap ng malaking promosyon.
A2-013|Pagkawala ng trabaho|Pagkawala ng trabaho o pagkakatanggal sa trabaho.
A2-014|Pagbabago ng karera o pagreretiro|Pagbabago ng karera o pagreretiro mula sa pagtatrabaho.
A2-015|Pagsisimula o pagsasara ng negosyo|Pagsisimula, pagmamay-ari, o pagsasara ng negosyo.
A2-016|Malaking parangal, pagkilala, o tagumpay|Pagtanggap ng malaking parangal, pampublikong pagkilala, o pag-abot ng malaking personal na tagumpay.
A2-017|Malaking personal na kabiguan|Isang personal na kabiguan o sagabal na itinuturing mong malaki.
A2-018|Malaking di-inaasahang pakinabang sa pera|Malaking mana, premyo, tubo sa investment, o ibang malaking di-inaasahang pakinabang sa pera.
A2-019|Malaking suliraning pinansiyal o bankruptcy|Malaking pagkalugi sa pera, krisis sa utang, o bankruptcy.
A2-020|Malaking legal na alitan|Mahalagang demanda, legal na alitan, o iba pang malaking usaping legal.
A2-021|Pagkakaospital, operasyon, pinsala, o matagal na paggaling|Malubhang pangyayaring pangkalusugan na nangangailangan ng ospital, operasyon, o matagal na paggaling.
A2-022|Mahalagang diyagnosis|Pagtanggap ng seryoso o nakapagpapabago-ng-buhay na medikal na diyagnosis.
A2-023|Malubhang sakit ng kapamilya|Pagkakaospital o pagtanggap ng mahalagang diyagnosis ng isang kapamilya.
A2-024|Paglikas o malaking pinsala sa bahay|Paglikas dahil sa sakuna o malaking pinsala sa bahay mo.
B-001|Unang pangalan lamang|Ibabahagi mo ba ang unang pangalan mo lamang?
B-002|Buong legal na pangalan|Buong legal mong pangalan kasama ang apelyido; hindi kasama rito ang hiwalay na tanong sa unang pangalan lamang.
B-003|Edad at taon ng kapanganakan|Saklaw ng edad, eksaktong edad, o taon ng kapanganakan.
B-004|Buong petsa ng kapanganakan|Buwan, araw, at buong petsa ng kapanganakan.
B-005|Mga panghalip at kasarian|Mga panghalip at impormasyon tungkol sa kasarian.
B-006|Nasyonalidad at bansang sinilangan|Nasyonalidad o pagkamamamayan at bansang sinilangan.
B-007|Bayang pinagmulan at kasalukuyang lungsod o rehiyon|Bayang pinagmulan at pangkalahatang kasalukuyang lokasyon sa antas ng lungsod, estado, o rehiyon.
B-008|Time zone|Ibabahagi mo ba ang kasalukuyan mong time zone?
B-009|Personal na numero ng telepono|Personal na numerong ginagamit para direktang makontak ka.
B-010|Mga personal na email address|Pangunahin o pangalawang personal na email address.
B-011|Mga online handle at pampublikong profile|Mga username, social media handle, larawan sa profile, personal na website, o propesyonal na profile.
B-012|Hanapbuhay at titulo sa trabaho|Hanapbuhay at kasalukuyang titulo sa trabaho.
B-013|Industriya|Ibabahagi mo ba ang industriya o malawak na larangang pinagtatrabahuhan mo?
B-014|Pangalan ng employer|Pangalan ng kasalukuyan mong employer o organisasyon.
B-015|Pangalan ng paaralan o unibersidad|Paaralan, kolehiyo, o unibersidad na pinapasukan o napasukan mo.
B-016|Mga detalye ng edukasyon|Antas ng edukasyon, larangan ng pag-aaral, at taon ng pagtatapos.
B-017|Katayuan sa relasyon o katayuang sibil|Kasalukuyang katayuan sa relasyon o katayuang sibil.
B-018|Sambahayan at estruktura ng pamilya|Laki ng sambahayan at kung mayroon kang mga anak.
B-019|Bilang ng mga kapatid|Ibabahagi mo ba kung ilan ang mga kapatid mo?
B-020|Mga wikang sinasalita|Mga wikang sinasalita o regular mong ginagamit.
C-001|Katumpakan ng lokasyon ng bahay|Gaano kaeksakto mong tutukuyin ang tirahan mo, mula sa malawak na rehiyon hanggang sa kapitbahayan o katulad na eksaktong lugar.
C-002|Buong address ng bahay|Numero ng bahay o gusali, numero ng apartment o yunit, at buong address ng bahay.
C-003|Eksaktong kasalukuyan o live na lokasyon|Eksaktong kasalukuyang lokasyon o access sa live na lokasyon mo.
C-004|Kasaysayan ng lokasyon|Tala ng mga lugar na napuntahan mo sa paglipas ng panahon.
C-005|Trabaho, ruta ng pagpasok, at eksaktong iskedyul|Address ng trabaho, ruta ng pagpasok, at eksaktong pang-araw-araw na iskedyul o madaling mahulaang gawi.
C-006|Itinerary at booking ng paparating na biyahe|Mga petsa, itinerary, tutuluyan, at detalye ng flight o tren sa paparating na biyahe.
C-007|Saklaw ng kita o eksaktong suweldo|Saklaw ng kita o eksaktong suweldo mo.
C-008|Impormasyon sa ipon at balanse ng account|Saklaw ng ipon o balanse ng account.
C-009|Utang at bayad sa tirahan|Halaga ng utang at upa o hulog sa bahay.
C-010|Credit score|Personal mong credit score.
C-011|Kasaysayan ng pagbili|Kasaysayan ng malalaking pagbili at pangkalahatang pagbili.
C-012|Alitan sa relasyon o pamilya|Pribadong alitan, hindi pagkakasundo, o tensiyon sa romantiko o pampamilyang relasyon.
C-013|Mga pribadong larawan|Mga pribadong larawang hindi para sa malawak na publiko.
C-014|Mga pribadong mensahe at nilalaman ng email|Nilalaman ng pribadong direct message, usapang text, o email.
C-015|Kasaysayan ng pagba-browse at paghahanap|Kasaysayan ng browser at mga paghahanap sa search engine.
C-016|Detalyadong paggamit ng app|Mga detalyadong tala o gawi sa paggamit ng app.
C-017|Mga aktibidad sa pakikipag-date|Gawain sa dating app, mga date, o ibang pribadong gawi sa pakikipag-date.
C-018|Oryentasyong seksuwal|Pribadong impormasyon tungkol sa oryentasyong seksuwal.
C-019|Mga paniniwalang panrelihiyon|Mga paniniwala at kaugnayang panrelihiyon o espirituwal.
C-020|Mga pananaw na pampolitika|Mga pananaw, kaugnayang pampolitika, o opinyong may kaugnayan sa pagboto.
C-021|Mga detalye ng legal na alitan|Pribadong detalye ng demanda, alitan, o ibang usaping legal.
C-022|Mga rekord ng pagganap sa pag-aaral o trabaho|Mga marka sa pag-aaral o pagsusuri sa pagganap sa trabaho.
C-023|Seguridad ng bahay|Mga detalye ng kandado, alarma, kamera, sistema ng access, o ibang panseguridad sa bahay.
C-024|Mga malalapit na kontak|Impormasyong nagpapakilala sa mga taong pinakamadalas mong kausapin o sandigan.
D-001|Tax o social identifier ng pamahalaan|Social Security number, taxpayer identification number, o katumbas na opisyal na tax o social identifier.
D-002|Numero ng lisensiya o pasaporte|Numero ng lisensiya sa pagmamaneho, pasaporte, o katulad na ID na inisyu ng pamahalaan.
D-003|Larawan ng ID o kalipunan sa pagpapatunay ng identidad|Larawan ng opisyal na ID o kalipunan ng dokumentong ginagamit upang patunayan ang identidad.
D-004|Bank account at routing number|Mga bank account at routing number na nagpapakilala sa account o nagruruta ng pera rito.
D-005|Numero ng debit o credit card|Buong numero ng debit o credit card.
D-006|Security code o PIN ng card|Security code ng card (CVV/CVC) o PIN ng payment card.
D-007|Mga kredensiyal sa online banking|Username at/o password sa online banking.
D-008|Mga password ng personal na account|Mga password para sa email, social media, pamimili, cloud, o ibang personal na account.
D-009|MFA o recovery code ng account|Pang-isang-gamit na authentication code, recovery code, o backup access code.
D-010|Mga sagot sa tanong sa seguridad|Mga sagot na ginagamit para patunayan ang identidad o bawiin ang account.
D-011|Recovery phrase o pribadong key sa cryptocurrency|Seed o recovery phrase ng cryptocurrency o pribadong cryptographic key.
D-012|Tax return o mga tax form|Buong tax return o mga detalyadong tax form.
D-013|Buong bank statement|Buong bank statement na may mga transaksiyon, balanse, at detalye ng account.
D-014|Investment o net-worth statement|Detalyadong net-worth statement o statement ng investment account.
D-015|Buong medikal na rekord|Buong o halos buong medikal na rekord.
D-016|Mga partikular na diyagnosis|Mga partikular na medikal na diyagnosis o kondisyon.
D-017|Listahan ng mga iniresetang gamot|Listahan ng mga iniresetang gamot.
D-018|Rekord ng kalusugang pangkaisipan o psychotherapy|Mga rekord ng kalusugang pangkaisipan o tala sa psychotherapy.
D-019|Mga resulta ng genetic test o DNA profile|Mga resulta ng genetic test o DNA profile.
D-020|Mga biometric identifier|Mga template o datos ng fingerprint, facial biometric, o voice biometric.
D-021|Health-insurance o medical account ID|Mga ID ng miyembro sa health insurance o numero ng medikal na account.
D-022|Detalyadong resulta sa laboratoryo|Mga detalyadong resulta ng laboratoryo o pathology.
D-023|Mga rekord ng medical imaging|Mga larawan o ulat ng X-ray, CT, MRI, o ultrasound.
D-024|Ulat ng background check|Detalyadong ulat ng background check o screening.
`);
export const TEXT_60=pairs(`
A1-001|Mga libangan, interes, at malikhaing gawain|Mga regular na libangan, kasalukuyang interes, at malikhaing gawain gaya ng sining, gawaing-kamay, potograpiya, o paggawa ng mga bagay.
A1-002|Musika, podcast, at interes sa balita|Panlasa sa musika at mga podcast, paksa ng balita, at pinagkukunan ng impormasyong sinusubaybayan mo.
A1-003|Paboritong artista, pelikula, o palabas|Kung papangalanan mo ang paboritong musikero o artista, o isang partikular na paboritong pelikula o palabas.
A1-004|Mga pelikula, palabas, pagbabasa, at laro|Hilig sa panonood, gawi at paborito sa pagbabasa, at mga larong nilalaro o sinusubaybayan mo.
A1-005|Isport, ehersisyo, at pagpapalakas ng katawan|Mga nilalaro o sinusubaybayang isport, gawi sa ehersisyo, interes at layunin sa pagpapalakas ng katawan.
A1-006|Pagkain, pagluluto, at mga restawran|Gawi sa pagluluto at pagkain sa labas, paborito at ayaw na pagkain, at gustong pagkain at restawran.
A1-007|Tulog, araw-araw, katapusan ng linggo, at pakikisalamuha|Oras ng pagtulog, gawi sa umaga at gabi, karaniwang araw, gawain sa katapusan ng linggo, at karaniwang planong panlipunan o pampamilya.
A1-008|Transportasyon, pamimili, pananamit, at mga tatak|Paraan ng pagbiyahe, gawi sa pamimili, estilo ng pananamit, at mga gustong tatak.
A1-009|Teknolohiya, app, screen, at pag-post|Gustong teknolohiya, ginagamit na app, gawi sa oras sa screen, at dalas ng pag-post o pampublikong pakikipag-ugnayan.
A1-010|Mga ginagamit na social platform|Kung sasabihin mo ang mga social platform o social media service na ginagamit mo.
A1-011|Paglalakbay, estilo ng bakasyon, at kamakailang biyahe|Saan at paano mo gustong maglakbay, estilo ng bakasyon, at kung nakapaglakbay ka kamakailan sa pangkalahatan.
A1-012|Mga alaga, tahanan, panahon, at lokal na lugar|Mga alaga, pag-aalaga ng halaman at tahanan, gusto sa bahay o dekorasyon, gawaing ayon sa panahon, hilig sa loob o labas, gustong panahon, at paboritong uri ng lokal na lugar.
A1-013|Komunidad, pag-aaral, trabaho, proyekto, at layunin|Pagboboluntaryo o samahan, klase o aralin, gawi sa pagkatuto, gawi o kaayusan ng trabaho, pagiging produktibo, kasalukuyang proyekto, at personal na layunin.
A1-014|Gustong paraan ng pakikipag-usap|Kung sasabihin mo kung paano mo gustong kontakin o kausapin ka ng mga tao.
A2-001|Malaking pangako o bagong seryosong relasyon|Pakikipagtipan para magpakasal, pag-aasawa, o pagsisimula ng seryosong romantikong relasyon.
A2-002|Paghihiwalay, diborsiyo, o seryosong pagwawakas|Pagtatapos ng mahalagang relasyon sa pamamagitan ng paghihiwalay, diborsiyo, o pagwawakas.
A2-003|Pagbubuntis, panganganak, paggamot para magkaanak, o pag-aampon|Malaking hakbang sa pagbuo ng pamilya na may pagbubuntis, panganganak, paggamot para magkaanak, o pag-aampon.
A2-004|Pagkawala ng pagbubuntis o pagluluksa|Pagkawala ng pagbubuntis o pagkamatay ng isang mahalagang tao sa iyo.
A2-005|Pag-aalaga o malubhang sakit ng kapamilya|Pagiging tagapag-alaga o pagharap sa malubhang sakit ng malapit na kapamilya.
A2-006|Paglipat, pagbabago ng tirahan, paglikas, o pinsala sa bahay|Paglipat, pagbili o pagbenta ng bahay, paglikas dahil sa sakuna, o malaking pinsala sa bahay.
A2-007|Malaking hakbang sa edukasyon, parangal, o tagumpay|Pagsisimula o pagtatapos ng mahalagang yugto ng edukasyon, o pagtanggap ng malaking pagkilala o tagumpay.
A2-008|Bagong trabaho, promosyon, pagbabago ng karera, o pagreretiro|Malaking positibo o planadong pagbabago ng karera gaya ng bagong trabaho, promosyon, pagbabago ng karera, o pagreretiro.
A2-009|Pagkawala ng trabaho o pagsisimula/pagsasara ng negosyo|Pagkawala ng trabaho o pagsisimula o pagsasara ng negosyo bilang malaking pagbabago sa pagtatrabaho.
A2-010|Malaking pakinabang sa pera, suliranin, o bankruptcy|Malaking pakinabang sa pera o malaking suliraning pinansiyal, kabilang ang bankruptcy.
A2-011|Malaking personal na kabiguan o legal na alitan|Mahalagang personal na kabiguan o malaking legal na alitan.
A2-012|Pagkakaospital, operasyon, malubhang pinsala, o diyagnosis|Malaking pangyayaring pangkalusugan na may ospital, operasyon, malubhang pinsala o paggaling, o mahalagang diyagnosis.
B-001|Unang pangalan lamang|Kung ibabahagi mo ang unang pangalan mo lamang.
B-002|Buong legal na pangalan|Buong legal mong pangalan, kasama ang apelyido.
B-003|Edad at petsa ng kapanganakan|Edad, taon ng kapanganakan, at buong petsa ng kapanganakan.
B-004|Mga panghalip, kasarian, nasyonalidad, sinilangan, at wika|Pangunahing demograpiko o personal na impormasyon, kabilang ang panghalip, kasarian, nasyonalidad, bansang sinilangan, at mga wikang sinasalita.
B-005|Pangkalahatang pinagmulan/kasalukuyang rehiyon at time zone|Kung sasabihin mo ang bayang pinagmulan o kasalukuyang lungsod o rehiyon at time zone, nang walang address ng kalye.
B-006|Personal na telepono at email|Personal na numero ng telepono at personal na email address o mga address.
B-007|Mga online handle at link sa pampublikong profile|Kung ibabahagi mo ang mga username o handle, o link sa mga pampublikong online profile.
B-008|Hanapbuhay, titulo, industriya, at employer|Hanapbuhay o titulo sa trabaho, industriya, at pangalan ng employer.
B-009|Paaralan/unibersidad at edukasyon|Pangalan ng paaralan o unibersidad, antas ng edukasyon, o kaugnay na pinag-aralan.
B-010|Katayuan sa relasyon at sambahayan/pamilya|Katayuan sa relasyon o katayuang sibil, estruktura ng sambahayan o pamilya, at impormasyon sa mga kapatid.
C-001|Katumpakan ng lokasyon at buong address ng bahay|Gaano kaeksakto mong tutukuyin ang tirahan mo, hanggang sa buong address at yunit ng bahay.
C-002|Eksaktong kasalukuyan/live na lokasyon at kasaysayan|Eksaktong kasalukuyan o live na lokasyon at tala ng mga lugar na napuntahan mo sa paglipas ng panahon.
C-003|Lokasyon ng trabaho, ruta/iskedyul, at itinerary|Lokasyon ng trabaho, ruta ng pagpasok o eksaktong iskedyul, at itinerary o booking ng paparating na biyahe.
C-004|Kita/suweldo at ipon/balanse ng account|Kita o eksaktong suweldo kasama ang impormasyon sa ipon at balanse ng account.
C-005|Utang, bayad sa tirahan, at credit score|Halaga ng utang o bayad sa tirahan at credit score mo.
C-006|Kasaysayan ng pagbili, pagba-browse/paghahanap, at app|Mga tala ng pagbili, pagba-browse o paghahanap, at detalyadong paggamit ng app.
C-007|Alitan sa relasyon/pamilya at pakikipag-date|Pribadong alitan sa relasyon o pamilya at aktibidad sa pakikipag-date.
C-008|Mga pribadong larawan at nilalaman ng mensahe/email|Mga pribadong larawan at nilalaman ng mga pribadong mensahe o email.
C-009|Oryentasyong seksuwal, relihiyon, at politika|Personal na impormasyon tungkol sa oryentasyong seksuwal, relihiyon, at mga pananaw na pampolitika.
C-010|Legal na alitan at pagganap sa pag-aaral/trabaho|Mga detalye ng legal na alitan at mga rekord na sumusuri sa pagganap sa pag-aaral o trabaho.
C-011|Seguridad ng bahay|Mga detalye ng alarma, kamera, kandado, kaayusan ng access, o iba pang seguridad ng bahay.
C-012|Mga malalapit na kontak|Impormasyong nagpapakilala sa mga taong pinakamadalas mong kausapin, sandigan, o makaugnayan.
D-001|Tax/social identifier at numero ng opisyal na ID|Social Security o tax identifier kasama ang numero ng lisensiya, pasaporte, o katulad na ID na inisyu ng pamahalaan.
D-002|Larawan ng ID, dokumento sa identidad, o background check|Larawan o kalipunan ng dokumentong nagpapatunay ng identidad, o detalyadong ulat ng background check o screening.
D-003|Bank account/routing at numero ng debit/credit card|Bank account at routing number kasama ang buong numero ng debit o credit card.
D-004|PIN/CVV at kredensiyal sa online banking|PIN o security code ng payment card at username o password sa online banking.
D-005|Mga password at MFA/recovery code|Mga password ng personal na account at pang-isang-gamit na authentication, backup, o recovery code.
D-006|Mga sagot sa seguridad at crypto recovery/private key|Mga sagot sa tanong sa seguridad at seed o recovery phrase ng cryptocurrency o pribadong cryptographic key.
D-007|Mga tax return at buong bank statement|Buong tax return o tax form, o buong bank statement na may balanse at mga transaksiyon.
D-008|Investment o net-worth statement|Detalyadong net-worth statement o statement ng investment account.
D-009|Buong medikal na rekord at partikular na diyagnosis|Buong o halos buong medikal na rekord at partikular na diyagnosis o kondisyon.
D-010|Mga reseta at rekord ng kalusugang pangkaisipan/psychotherapy|Impormasyon sa mga iniresetang gamot at mga rekord ng kalusugang pangkaisipan o tala sa psychotherapy.
D-011|Genetic/DNA at mga biometric identifier|Impormasyon sa genetic test o DNA at mga template o datos ng fingerprint, mukha, o boses.
D-012|Health-insurance/medical ID, laboratoryo, at imaging|Mga identifier ng health insurance o medical account, at detalyadong rekord ng laboratoryo o pathology at medical imaging.
`);
