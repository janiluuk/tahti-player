import type { HelpArticleTranslation } from './help';

/**
 * Finnish help copy, keyed by article slug. Each `sections` array lines up
 * index-for-index with the English article in `help.ts`; tables and the
 * keyboard shortcut lists are not translated here.
 */
export const HELP_ARTICLES_FI: Record<string, HelpArticleTranslation> = {
  'getting-around': {
    title: 'Näin liikut Tahdissa',
    description:
      'Yksinkertainen kartta: Kuuntele, Kirjasto, Studio, Asetukset ja soitin.',
    sections: [
      {
        heading: 'Mikä tahti.live on?',
        body: [
          'tahti.live on voittoa tavoittelematon lähetysalusta itsenäisille artisteille. Se on tehty tukemaan artisteja, ei algoritmeja. Kuuntelu on ilmaista ja jäsenkanavilla häviötöntä. Artistijäsenyys maksaa 40 €/vuosi ja rahoittaa oman kanavasi, julkaisusi ja livelähetyksesi.',
          'Yksi jäsen, yksi ääni: alustaa ohjaavat jäsenten aloitteet ja vuosikokous, ei yrityksen hallitus. Lähes kaikki fanien tuki menee artistille, ja koodi on avointa AGPL-lisenssillä.',
          'Koko esittely, suunnitelmat, rahoitus ja hallinto: /what-is-it.',
        ],
      },
      {
        heading: 'Pääalueet',
        body: [
          'Kuuntele on aloituspaikka musiikin, kanavien, radion ja julkisten sivujen löytämiseen. Se toimii ilman tiliä.',
          'Radio ja Löydä ovat sivupalkissa Kuuntelen vieressä. Suosikit on oma kohtansa tallennetuille kanaville ja kappaleille.',
          'Kirjasto (kirjautuneena) sisältää äänet, kokoelmat, tallenteet, lataukset ja muun Studion luettelotyön.',
          'Studio on artisteille: yleiskatsaus, tilastot, julkaisut, yleisö, live-lähetys, lähetysaikataulu ja kanavan asetukset.',
          'Ohjekeskus ja Asetukset ovat sivupalkin alaosassa. Asetuksissa ovat tili, teemat, lisäosat ja valinnat.',
          'Oikea reunapalkki sisältää jonon, chatin ja ilmoitukset. Omalta koneelta soitettavat tiedostot toimivat vain työpöytäsovelluksessa (Kirjasto → Paikalliset tiedostot). Soitin näkyy vasta, kun jokin kappale on ladattu.',
        ],
      },
      {
        heading: 'Mihin kukin alue on',
        body: [
          'Kuuntele on koti: jatka kuuntelua, yhteisöradio ja kuka on nyt lähetyksessä. Syöte näyttää seuraamiesi artistien julkaisut, Historia viimeksi soitetut.',
          'Löydä sisältää widgetit, artistihakemiston (haku ja suodattimet) ja tapahtumapaikat. Suosikeissa ovat tallennetut kanavat, radiot ja kappaleet.',
          'Studion välilehdet (Yleiskatsaus, Tilastot, …) ovat Studion valikossa. Sivujen omat alivälilehdet ovat suoraan Studion valikkorivin alla, sivun otsikon yläpuolella. Brändäys, galleria ja lehdistöpaketti ovat kohdassa Asetukset → Artisti; Kanavasuunnittelija on kohdassa Asetukset → Kanava ja chat.',
          'Paina H, niin saat opastetun kierroksen nykyisen sivun säätimiin. Pidemmät ohjeet ovat tässä ohjekeskuksessa.',
        ],
      },
      {
        heading: 'Kirjautuminen',
        body: [
          'Voit selata ja kuunnella kirjautumatta. Kirjaudu, kun haluat tallentaa suosikkeja, tehdä soittolistoja, tilata artisteja, chattailla, ladata musiikkia tai käyttää Studiota.',
          'Jos avaat yksityisen alueen kirjautumatta, Tahti vie sinut kohtaan Asetukset → Tili, jossa voit kirjautua ja jatkaa.',
        ],
      },
    ],
  },
  'for-listeners': {
    title: 'Kuuntelijan opas',
    description:
      'Löydä kanavat, tue artisteja suoraan, lataa ja chattaile. Tiliä ei tarvita.',
    sections: [
      {
        heading: 'Löydä kuunneltavaa',
        body: [
          'Katso Kuuntele-sivulta, kuka on lähetyksessä, tai avaa kanava osoitteessa /channel/$slug.',
          'Kun artisti ei ole livenä, kanava soittaa arkistoa.',
          'Tahti Radio (/radio) on reilusti vuorotteleva lähetys koko yhteisöltä. Avaa Radion kalenteri nähdäksesi koko ohjelmiston (/schedule), tai varaa lähetysvuoro kirjautuneena.',
          'Löydä-sivulla ovat widgetit, artistit ja tapahtumapaikat. Löydä → Paikat näyttää vahvistetut paikat, Löydä → Artistit hakemiston.',
          'Pyöritätkö tapahtumapaikkaa? Rekisteröi se kohdasta Löydä → Paikat. Omat paikat (/venues/mine) näyttää, onko hallitus vahvistanut sen; siellä voit myös muokata tietoja ja lisätä tai perua keikkoja.',
          'Kirjautuneet kuuntelijat voivat asentaa Disco-widgetejä Kuuntele-sivulle kohdasta Asetukset → Lisäosat → Löytäminen.',
        ],
      },
      {
        heading: 'Tue artistia',
        body: [
          'Avaa /u/$username ja valitse Tilaa. Artisti päättää tilaustasot.',
          'Suurin osa maksustasi menee artistille. Voit perua milloin tahansa tililtäsi.',
        ],
      },
      {
        heading: 'Chat',
        body: [
          'Livechat on jokaisen kanavan sivulla (ja osoitteessa /chat/$slug). Avaa kanava, joka on lähetyksessä tai jossa chat on päällä.',
          'Viestit (Kirjastossa) ovat yksityisviestejä tilien välillä, eivät kanavan chat.',
          'Kirjautumaton liittyminen livekanavalle voi vaatia hCaptcha-tarkistuksen. Moderaattorit voivat hiljentää tai poistaa häiritseviä viestejä.',
        ],
      },
      {
        heading: 'Kuunnelkaa yhdessä',
        body: [
          'Valitse julkisella soittolistalla tai kokoelmalla Aloita Jam. Se avaa yhteisen kuuntelusession, johon voit kutsua muita linkillä.',
          'Tämä on eri asia kuin työpöytäsovelluksen Tahti Jam -kaukosäädin (Asetukset → Integraatiot), jolla ohjaat työpöytäsoitinta puhelimesta.',
        ],
      },
    ],
  },
  player: {
    title: 'Soittimen käyttö',
    description:
      'Soita kappaleita, hallitse jonoa, käytä visualisointeja ja ymmärrä soittimen tilat.',
    sections: [
      {
        heading: 'Soita jotain',
        body: [
          'Valitse kappale tai paina Toista kanavalla, julkaisulla, soittolistalla tai radioasemalla. Soiva kohde näkyy sovelluksen alareunan soittimessa.',
          'Kun mitään ei ole ladattu, soitin pysyy piilossa eikä vie tilaa sivulta. Lataa kappale, niin säätimet tulevat näkyviin.',
          'Mobiilissa pieni soitin on alavalikon yläpuolella, joten voit vaihtaa osiota ilman että säätimet katoavat. Laajenna se koko näytön soittimeksi.',
        ],
      },
      {
        heading: 'Jono ja visualisoinnit',
        body: [
          'Jonopainikkeesta näet, mitä soi seuraavaksi, voit järjestää kuuntelua uudelleen tai tyhjentää jonon. Edellinen ja seuraava liikkuvat jonossa.',
          'Valitse visualisointi kohdasta Asetukset → Lisäosat → Visualisoinnit, tai käytä artistin valitsemaa kanavan visualisointia. Visualisoinnit voi kytkeä pois, kun haluat rauhallisemman näytön.',
        ],
      },
      {
        heading: 'Kappalerivit',
        body: [
          'Kanavan kappaleet, artistin suosituimmat, soittolistat ja Kuuntelen uudet kappaleet näkyvät riveinä: pyöreä toistopainike, tyylilaji ja kesto sekä aaltomuoto, jota klikkaamalla tai vetämällä hyppäät kappaleessa.',
          'Aaltomuodon alla: sydän ja luku tykkää kappaleesta (kirjautuneena), sitten lisää jonoon, lisää soittolistaan ja lataa, jos artisti sallii. Oikealla ovat julkaisupäivä sekä tykkäysten, soittojen, latausten ja kommenttien määrät.',
          'Samat rivit näkyvät tykätyissä kappaleissa, soittolistoissa, julkaisusivuilla ja kanavan Soittolista-widgetissä; kappaleen omalla sivulla näkyvät myös soitot.',
          'Kappaleen sivulla on lisäksi välilehdet julkisille kokoelmille, joissa kappale on, sekä sille, ketkä tykkäsivät, jakoivat ja soittivat sen (vain kirjautuneet kuuntelijat; nimettömiä soittoja ei koskaan näytetä). Näytä lisää lataa välilehden loput.',
        ],
      },
    ],
  },
  'favorites-playlists': {
    title: 'Suosikit ja soittolistat',
    description:
      'Tallenna kappaleita, artisteja, kanavia ja soittolistoja ja pidä omat listasi järjestyksessä.',
    sections: [
      {
        heading: 'Tallenna ja löydä suosikit',
        body: [
          'Paina sydäntä tai Suosikki kappaleella, soittolistalla, kanavalla tai artistilla. Avaa Suosikit sivupalkista soittaaksesi, jonottaaksesi tai poistaaksesi tallennettuja.',
          'Suosikit ovat järjestyksessä uusimmasta vanhimpaan.',
        ],
      },
      {
        heading: 'Tee soittolista',
        body: [
          'Avaa Kirjasto → Kokoelmat (tai Studio → Kokoelmat) ja luo soittolistakokoelma. Anna nimi, lisää kappaleet ja valitse, onko se julkinen.',
          'Julkisen soittolistan voi löytää, tilata, soittaa ja upottaa. Yksityiset soittolistat näkyvät vain sinulle.',
        ],
      },
    ],
  },
  'comments-and-timeline': {
    title: 'Kommentit ja aikajanareaktiot',
    description:
      'Jätä kommentti juuri siihen kohtaan, jota kuuntelet kappaleen koko näkymässä.',
    sections: [
      {
        heading: 'Kommentoi hetkeä',
        body: [
          'Avaa kappaleen koko näkymä ja pysäytä tai siirry kohtaan, josta haluat puhua. Aikajanan alla olevassa reaktiorivissä ovat hymiöt ja kommentointi.',
          'Valitse hymiö reagoidaksesi siihen kohtaan. Kommentti-ikoni avaa kommenttikentän; kommentin alkuun lisätään nykyinen aika, jotta muut tietävät, mistä kohtaa kuunnella.',
          'Kommentointi vaatii kirjautumisen. Artisti voi kytkeä kommentit pois yksittäiseltä kappaleelta Studion asetuksista.',
        ],
      },
    ],
  },
  'shared-jam': {
    title: 'Yhteiskuuntelu (Jam)',
    description:
      'Aloita Jam soittolistasta, niin vieraat kuulevat saman jonon samaan aikaan.',
    sections: [
      {
        heading: 'Aloita Jam',
        body: [
          'Avaa julkinen soittolista tai kokoelma (Kirjasto → Kokoelmat, tai jonkun muun julkinen kokoelmasivu). Valitse Aloita Jam.',
          'Jaa /jam/$code-linkki. Vieraat liittyvät selaimessa; isäntä ohjaa toistoa, taukoa ja jonoa, ellei vieraalle ole annettu yhteisohjausta.',
          'Kun Jam päättyy, kaikki palaavat Kuuntele-sivulle. Virheellinen tai päättynyt koodi näyttää selkeän virheen Jam-sivulla.',
        ],
      },
      {
        heading: 'Ei työpöydän kaukosäädin',
        body: [
          'Työpöydän Tahti Jam (Asetukset → Integraatiot → Tahti Jam) on puhelinkaukosäädin lähiverkon työpöytäsoittimelle. Yhteiskuuntelun Jamit ovat erillisiä verkkosessioita osoitteissa beta.tahti.live / tahti.live.',
        ],
      },
    ],
  },
  'for-artists': {
    title: 'Artistin opas',
    description:
      'Luo kanava, mene liveen, lataa settejä ja jaa julkiset linkkisi.',
    sections: [
      {
        heading: 'Luo kanavasi',
        body: [
          'Aseta Studiossa kanavasi tunnus. Julkinen kanavasi on /channel/oma-tunnus ja artistiprofiilisi /u/käyttäjänimi.',
          'Studion työkaluilla lähetät, hallitset musiikkia, suunnittelet ohjelmia, opit tuntemaan yleisösi ja suunnittelet kanavasi ulkoasun.',
        ],
      },
      {
        heading: 'Lähetä ja julkaise',
        body: [
          'Kopioi RTMP- tai Icecast-tunnukset lähetysstudiosta ja lähetä OBS:llä, Mixxxillä tai Traktorilla.',
          'Lataa arkistosettejä ja julkaisuja Studiossa; ne näkyvät kanavallasi ja profiilissasi.',
          'Jakelu on Studion välilehti Julkaisujen vieressä: toimitusten tila ja rojaltit. Studion etusivu ja Julkaisut-sivu linkittävät sinne, kun sinulla on julkaisuja.',
        ],
      },
      {
        heading: 'Artistigalleria',
        body: [
          'Avaa Asetukset → Artisti → Galleria lisätäksesi kuvia julkiselle artistisivullesi. Lataa kuvia gallerian otsikon plus-ikonista; erillistä Lisää kuvia -painiketta ei ole.',
          'Kytke Julkinen päälle, niin galleria näkyy profiilissasi, tai pidä se pois päältä, kun järjestelet kuvia.',
          'Vedä kuvaa muuttaaksesi järjestystä, tai käytä nuolia hiiren ollessa kuvan päällä. Valitse kuvat ruksilla ja poista ne, joita et halua.',
          'Mukaan valitsemasi kuvat voivat näkyä myös lehdistöpaketissasi. Kanavan taustat ja diaesitykset kerrotaan oppaassa Suunnittele kanavasi.',
        ],
      },
      {
        heading: 'Studion sivut',
        body: [
          'Studion sivun alivälilehdet ovat Studion valikkorivin alla ja sivun otsikon yläpuolella, samoin kuin Tilastoissa (Yleiskatsaus / Soitot / Kärkilistat).',
          'Kappaleet sisältää arkistosi ja tiedostosi. Brändäys (profiilikuva, galleria, lehdistöpaketti) on kohdassa Asetukset → Artisti; Kanavasuunnittelija on kohdassa Asetukset → Kanava ja chat. Päivitykset ovat julkaisut ja uutiskirje. Kanava sisältää lähetysavaimet, radioasetukset ja monilähetyksen.',
          'Ylläpidon moderointijonot (tuki, beta, radio, ilmoitukset) toimivat samalla tavalla Ylläpidon valikossa.',
        ],
      },
      {
        heading: 'Fanituki ja tilaukset',
        body: [
          'Studio → Fanit → Ansiot näyttää viimeisimmät fanitilaukset, maksutilastot ja tyypillisen tilauksen jakautumisen.',
          'Sivulta aukeava ansio-opas kertoo Stripen kuluista, 2 %:n toimintamaksusta ja apurahoista.',
        ],
      },
    ],
  },
  'channel-design': {
    title: 'Suunnittele kanavasi',
    description:
      'Muokkaa Kanavasuunnittelijalla otsikkoa, soitinta, taustaa, peitteitä ja visualisointia.',
    sections: [
      {
        heading: 'Valitse ulkoasu',
        body: [
          'Avaa Asetukset → Kanava ja chat → Kanavasuunnittelija. Esikatselu näyttää, mitä kuuntelijat näkevät julkisella kanavallasi ja artistisivullasi.',
          'Valitse lohko elementtivalikosta: julkaisut, kappaleet, uusimmat, syöte, uutiset, soitin tai tausta. Piilota lohko silmäpainikkeella.',
          'Soitin säätää lavaa, visualisointia, liukuväriä ja peitettä. Tausta säätää otsikon tyyliä, diaesitystä ja sivun värejä.',
        ],
      },
      {
        heading: 'Lisää tausta tai galleria',
        body: [
          'Käytä taustana videota, still-kuvaa tai diaesitystä. Kun tausta on olemassa, suunnittelija näyttää poistotoiminnon uuden lisäämisen sijaan.',
          'Tallenna asettelu muutosten jälkeen. Tausta on vapaaehtoinen; ilman sitä valittu liukuväri tai visualisointi täyttää tilan.',
        ],
      },
    ],
  },
  'desktop-library': {
    title: 'Paikalliset tiedostot ja Soulseek',
    description:
      'Tuo omia äänitiedostoja kohdasta Kirjasto → Paikalliset tiedostot, ja miten Soulseek liitetään myöhemmin.',
    sections: [
      {
        heading: 'Paikalliset tiedostot',
        body: [
          'Kirjasto → Paikalliset tiedostot kuuluu Tahti Player -työpöytäsovellukseen. Se indeksoi koneesi kansiot ja soittaa ne yhteisessä Tahti-soittimessa.',
          'Verkkosivulla (tahti.live) välilehti on piilossa. Käytä sen sijaan Studio → Lataa viedäksesi ääntä Tahti-arkistoosi.',
        ],
      },
      {
        heading: 'Soulseek',
        body: [
          'Soulseek on vertaisverkko. Tahti ei hae tai siirrä tiedostoja palvelimiensa kautta. Myöhempi työpöytälisäosa liittää oman Soulseek-tilisi Tahti Player -sovellukseen.',
          'Kunnes se on valmis, Asetukset → Lisäosat → Tuonti näyttää Määritä-ikkunan, joka kertoo rajoituksesta.',
          'Vastaat itse siitä, mitä jaat ja lataat. Käytä vain materiaalia, johon sinulla on oikeudet.',
        ],
      },
    ],
  },
  'uploads-and-processing': {
    title: 'Lataus ja käsittely',
    description:
      'Lataa kappaleita ja settejä, seuraa niiden etenemistä ja löydä ne valmiina.',
    sections: [
      {
        heading: 'Lataa ääntä',
        body: [
          'Avaa Studio → Lataa (myös Kirjasto → Lataa), valitse äänitiedosto ja täytä tiedot. Uusi lataus ilman kansikuvaa saa automaattisesti abstraktin pikkukuvan.',
          'Arkistokohteen sivulla voit lisätä kansikuvan, taustan, kappalelistan, näkyvyyden, kommentit, lataukset ja julkaisutiedot.',
        ],
      },
      {
        heading: 'Seuraa käsittelyä',
        body: [
          'Kun lataus tai palvelusta tuonti on käsittelyssä, vasemman yläkulman valikossa näkyy sininen merkkivalo. Avaa se nähdäksesi jonossa ja työn alla olevat kohteet.',
          'Kun käsittely valmistuu, merkkivalo sammuu ja ilmoitus vie suoraan kappaleeseen. Pitkät äänitteet ja tuonnit voivat viedä aikaa.',
        ],
      },
      {
        heading: 'Lisää musiikkia Mikseri.netistä',
        body: [
          'Avaa kokoelma Studiossa ja valitse "Lisää musiikkisi Mikseri.netistä": liitä Mikserin kappalesivu, sen virallinen upotusosoite tai numeerinen kappaletunnus, ja kirjoita nimi ja artistin nimi.',
          'Vahvista, että omistat kappaleen tai sinulla on lupa upottaa se. Tahti tallentaa vain upotusviitteen ja tietosi; ääni pysyy Mikseri.netissä ja soi sen soittimessa.',
        ],
      },
    ],
  },
  broadcast: {
    title: 'Lähetyksen asetukset',
    description:
      'Yhdistä OBS, Streamlabs, Mixxx tai Traktor Tahdin lähetysavaimeen.',
    sections: [
      {
        heading: 'OBS / Streamlabs (RTMP)',
        body: [
          'Kojelauta → Lähetys → kopioi Palvelin ja Lähetysavain.',
          'OBS → Asetukset → Lähetys: palveluksi Mukautettu, liitä palvelin ja avain.',
          'Äänen bittinopeus 128–192 kbps AAC. Aloita lähetys; kanava näyttää Live, kun yhteys syntyy.',
          'Lähetyssivulla on "Valmis OBS-asetus" -lataus, jossa on kohtausasetus ja tämän kanavan palvelin ja avain valmiiksi täytettyinä, jos haluat tuoda profiilin kirjoittamatta arvoja käsin.',
        ],
      },
      {
        heading: 'Traktor, Mixxx ja muut Icecast-yhteensopivat',
        body: [
          'Lähetys → Yhdistä lähetysohjelma → valitse Traktor tai Icecast nähdäksesi ohjelmaan sopivat Palvelin-, Mount- ja Salasana-kentät.',
          'Liitä arvot ääniohjelmasi lähetysasetuksiin ja kytke sen On Air -lähetys päälle samaan tapaan kuin OBS:ssä.',
        ],
      },
      {
        heading: 'Puhelin',
        body: [
          'Samat RTMP-tunnukset toimivat Larix Broadcasterissa ja vastaavissa sovelluksissa.',
        ],
      },
    ],
  },
  releasing: {
    title: 'Musiikin julkaisu',
    description:
      'Selkeä opas julkaisun valmisteluun, tunnisteiden valintaan ja jakamiseen kaikkialle.',
    sections: [
      {
        heading: 'Mitä julkaisutapaa kannattaa käyttää?',
        body: [
          'Kaikkia tapoja ei tarvita. Valitse ne, jotka sopivat siihen, mitä sinulla jo on.',
          'UPC / EAN on viivakoodi, joka tunnistaa koko julkaisun. Käytä sitä, jos levy-yhtiö, jakelija tai viivakoodipalvelu on antanut sellaisen.',
          'MusicBrainz on yhteisön ylläpitämä musiikkitietokanta. Käytä sitä, jos haluat julkaisusi ja artistitietosi avoimeen julkiseen tietokantaan.',
          'Discogs on toinen yhteisötietokanta, erityisen hyödyllinen fyysisille julkaisuille ja vanhoille painoksille.',
          'Älylinkit kokoavat kuuntelupaikat, kuten Spotifyn, Apple Musicin, Bandcampin, SoundCloudin, YouTube Musicin ja Tidalin, yhdelle Tahti-sivulle.',
          'Toimitus lähettää kelpoiset julkaisutiedot jakelupalveluun, kuten Revelatoriin. Se on automaattinen tapa toimittaa musiikkia tuetuille suoratoistopalveluille; maksuja tai vaatimuksia voi olla.',
        ],
      },
      {
        heading: 'Suoraviivainen julkaisun kulku',
        body: [
          'Luo julkaisu kohdassa Studio → Julkaisut ja lisää lopullinen kappalelista, kansikuva, päivämäärä ja kuvaus.',
          'Avaa Julkaisutoimet → Luettelo ja tekijät. Kytke päälle vain haluamasi tavat; kukin näyttää sitten tarvitsemansa kentät.',
          'Tallenna luettelotiedot. Vie JSON, kun haluat siirrettävän kopion julkaisun tiedoista.',
          'Käytä MusicBrainzin tai Discogsin opasikoneita. Niiden Kopioi esitäyttö -toiminnot valmistelevat nimen, viivakoodin, tekijät ja kappalelistan, ja ulkoiset linkit avaavat palvelun.',
          'Kun olet lähettänyt tiedot ulkoiseen tietokantaan, kopioi sen julkaisu- tai artistitunnus takaisin Tahtiin, jotta yhteys tallentuu.',
        ],
      },
      {
        heading: 'MusicBrainz selkokielellä',
        body: [
          'Avaa MusicBrainzin julkaisueditori oppaasta. Valitse julkaisutyyppi, kirjoita artisti ja päivämäärä, lisää kappaleet järjestyksessä ja tallenna.',
          'MusicBrainz ei ole musiikkikauppa eikä toimita ääntä Spotifyhin. Se on avoin viitetietokanta tarkkoja julkisia tietoja ja tunnistamista varten.',
        ],
      },
      {
        heading: 'Discogs selkokielellä',
        body: [
          'Hae Discogsista ennen uuden merkinnän tekemistä, jotta et luo kaksoiskappaletta.',
          'Käytä Discogsia painoksen, levy-yhtiön, formaatin, maan, päivämäärän, viivakoodin ja kappalelistan luettelointiin. Se on erityisen hyödyllinen vinyyleille, CD:ille ja muille fyysisille versioille.',
        ],
      },
      {
        heading: 'Mitä tekniset kentät tarkoittavat',
        body: [
          'Julkaisun MBID on MusicBrainzin yksilöllinen tunnus julkaisulle. Artistin MBID tunnistaa artistin siellä. Discogsin julkaisutunnus tunnistaa Discogs-merkinnän.',
          'P-rivi kertoo, kuka omistaa äänitteen tekijänoikeuden. C-rivi kertoo, kuka omistaa kansitaiteen tai kustannusoikeuden. Levymerkki on julkaisun yhteydessä näkyvä levy-yhtiön nimi.',
          'Jos et tiedä kentän arvoa, jätä se tapa pois päältä tai kysy levy-yhtiöltä tai jakelijalta. Älä keksi tunnisteita.',
        ],
      },
    ],
  },
  multistream: {
    title: 'Monilähetys',
    description:
      'Peilaa livelähetyksesi YouTubeen, Twitchiin ja muille alustoille.',
    sections: [
      {
        heading: 'Miten se toimii',
        body: [
          'Lähetä kerran Tahtiin. Monilähetyksen kohteet asetetaan Studiossa; älä ohjaa OBS:ää suoraan YouTube- tai Twitch-avaimiin, jos Tahti jo peilaa.',
          'Tuettuja kohteita ovat YouTube Live, Twitch, Facebook Live, Kick, Mixcloud ja muut, kun RTMP-avaimet ovat saatavilla.',
        ],
      },
    ],
  },
  'embed-and-share': {
    title: 'Jaa ja upota musiikkia',
    description:
      'Jaa julkisia kappaleita, julkaisuja, soittolistoja ja artistisivuja tai lisää niitä toiselle sivustolle.',
    sections: [
      {
        heading: 'Mitä voi jakaa',
        body: [
          'Julkisilla artistisivuilla, kanavilla, kappaleilla, julkaisuilla ja soittolistoilla on jakolinkit. Listaamattomat linkit toimivat linkin saaneille, mutta eivät näy hauissa.',
          'Kirjautuneet kuuntelijat voivat tilata julkisen soittolistan. Tilaus pitää sen helposti löydettävissä ilman kappaleiden kopioimista omalle listalle.',
        ],
      },
      {
        heading: 'Upota julkinen sivu',
        body: [
          'Valitse Upota julkisella kappaleella, julkaisulla, soittolistalla tai kanavalla, kopioi iframe-koodi ja liitä se sivustolle, joka hyväksyy upotukset.',
          'Sivun pitää pysyä julkisena, jotta upotus toimii. Palveluissa isännöidyt kappaleet käyttävät upotuksessa palvelun omaa soitinta.',
        ],
      },
    ],
  },
  'tier-limits': {
    title: 'Ilmaistaso vai jäsenyys',
    description:
      'Livetuntien rajat, äänenlaatu ja mitä muuttuu, kun tuet Tahti ry:tä.',
    sections: [
      {
        heading: 'Ilmaistason artisti',
        body: [
          'Noin 1 tunti livelähetystä viikossa (nollautuu maanantaina klo 00.00 UTC).',
          'Kuuntelijat kuulevat noin 192 kbps MP3 HLS -lähetyksen; arkisto soi, kun et ole livenä.',
        ],
      },
      {
        heading: 'Tahti ry:n jäsen',
        body: [
          'Rajaton liveaika ja osuuskunnan tukeminen (jäsenyys 40 €/vuosi).',
          'Jäsenyys on yhdistyksen tukemista, ei kuluttajan "tilaus".',
          'Jäsenet näkevät Hallinto-sivulla (/governance) enemmän: nykyisen hallituksen, hallitusvaalit (asetu ehdolle tai vetäydy ehdokasasettelun aikana), julkaistut vuosikertomukset sekä yhdistyksen rekisteritiedot ja tilintarkastajat.',
          'Onko jäsentiedoissasi tai julkaistussa tiedossa virhe? Käytä Hallinto-sivun Pyydä korjausta -toimintoa; hallituksen vastaus näkyy siellä, ja voit perua pyynnön sen odottaessa.',
        ],
      },
    ],
  },
  earnings: {
    title: 'Ansiot ja fanitilaukset',
    description:
      'Miten fanitilaus jakautuu, missä maksut näkyvät ja miten apurahat tulevat päälle.',
    sections: [
      {
        heading: 'Mistä katsoa',
        body: [
          'Studio → Fanit → Ansiot on tilausten hallintanäkymä: viimeisimmät fanitilaukset, tilaaja- ja maksutilastot sekä tyypillisen 5 euron tilauksen erittely.',
          'Kun Stripe on käytössä, Studioon tulee myös Stripe-kojelauta maksutilillesi ja Express-kojelauta. Paina H tai Yleisö-sivun ohjeikonia opastettua kierrosta varten.',
        ],
      },
      {
        heading: 'Rahan kulku',
        body: [
          'Kuuntelija maksaa sinulle kuukausittain Stripen kautta. 5 euron tilauksesta Stripe pitää noin 0,45 € (2,9 % + 0,30 €), Tahti pitää 0,10 € 2 %:n toimintamaksuna, ja sinä saat 4,45 € Stripe Connectin kautta kirjanpitomallissa.',
          'Tämä jako näkyy Yleisö-sivulla ja tässä oppaassa. Tarkistamme vielä, että jokainen Stripen maksu vastaa 4,45 €:a, joten pidä näytön lukua dokumentoituna jakona, ei taattuna tilisiirtona. Stripe-kojelautasi näyttää, mitä oikeasti tuli perille.',
          '2 %:n maksu kattaa Connect-alustan kulut, laskutustuen, riitatapaukset ja GDPR-työn. Se on toimintakulu, ei yhdistyksen voittoa; ylijäämä siirtyy seuraavaan artistien apurahapottiin.',
        ],
      },
      {
        heading: 'Kun fani peruu',
        body: [
          'Edut säilyvät laskutuskauden loppuun ja sen jälkeen noin seitsemän päivän armonajan. Sinun ei tarvitse tehdä mitään; tilauslista päivittyy itsestään.',
        ],
      },
      {
        heading: 'Apurahat tulevat päälle',
        body: [
          'Lataukset ja fanitilausten eurot lasketaan myös vuosittaisiin osallistumisyksiköihin. Kelpoiset artistit jakavat osuuskunnan apurahapotin; se tulee jo tilauksista maksettujen rahojen lisäksi.',
        ],
      },
    ],
  },
  'keyboard-shortcuts': {
    title: 'Pikanäppäimet',
    description:
      'Kaikki sovelluksen yleiset pikanäppäimet, myös opastettu sivukierros.',
    sections: [
      { heading: 'Sivukierros', body: [] },
      { heading: 'Navigointi', body: [] },
      { heading: 'Soitin', body: [] },
      { heading: 'Huomiot', body: [] },
    ],
  },
  'add-ons': {
    title: 'Lisäosat',
    description:
      'Mitä kohdassa Asetukset → Lisäosat on valmiina tänään, ja miten kunkin saa päälle.',
    sections: [
      {
        heading: 'Missä lisäosat ovat',
        body: [
          'Avaa Asetukset → Lisäosat. Luokat vastaavat alla olevaa taulukkoa: Teemat, Visualisoinnit, Tuonti, Monilähetys, Tunnistus, Äänityökalut, Radio, Upotus, Löytäminen, Kanava ja Toisto. Scrobblaus on kohdassa Asetukset → Integraatiot.',
          'Listalla ovat vain integraatiot, joita voit käyttää nyt. ListenBrainz- ja Last.fm-scrobblaus ovat valmiita (vain kuuntelujen lähetys). Suunnitellut Nuclear-rekisterin kohteet, kuten ListenBrainz-listat, OmniSource, KHInsider ja NetEase, lisätään oppaaseen vasta, kun niillä on Tahti-sopimus.',
        ],
      },
      {
        heading: 'Valmiit lisäosat',
        body: [
          'Tila Valmis tarkoittaa, että polku toimii alusta loppuun, myös sovelluksen sisäinen toisto, jos rivi niin kertoo. Tuonti valmis tai Haku valmis tarkoittaa, että yhdistäminen tai haku toimii, mutta loppuosa, yleensä palvelinpuolen tuonti, on vielä kesken; katso tarkka rajoitus sarakkeesta "How to use it".',
          'hearthis.at-, Mixcloud-, Spotify- ja Bandcamp-kappaleisiin viitataan, niitä ei isännöidä: Tahti tallentaa vain linkin, ja palvelun oma soitin toistaa äänen, kun painat niiden kappaleissa Toista, myös kappaleen omalla sivulla.',
        ],
      },
      {
        heading: 'Jos jotain puuttuu',
        body: [
          'Vientikohteet, kuten Spotify tai Apple Music, ovat julkaisun toimituslinkkejä kohdassa Studio → Jakelu, eivät vielä asennettavia lisäosia.',
          'Tuontilähteitä hallitaan kohdassa Lisäosat → Tuonti. Siellä näkyvät vain lähteet, joilla on toimiva Tahti-toteutus.',
        ],
      },
    ],
  },
  'desktop-mcp': {
    title: 'Tekoälytyökalut (MCP)',
    description:
      'Anna Clauden, Cursorin tai muun tekoälytyökalun hakea Tahdista ja hallita tykkäyksiäsi, seurattujasi ja soittolistojasi, tai ohjata työpöytäsovellusta.',
    sections: [
      {
        heading: 'Kaksi tapaa yhdistää',
        body: [
          'Tahti-tilisi: tekoälytyökalu yhdistää Tahdin rajapintaan henkilökohtaisella API-tunnisteella. Tämä toimii kaikkialla, missä käytät Tahtia, myös tällä sivustolla.',
          'Työpöytäsovellus: tekoälytyökalu yhdistää koneesi Tahti Player -sovellukseen ja ohjaa, mitä se soittaa, sen jonoa, työpöytäkirjastoasi ja radiota.',
        ],
      },
      {
        heading: 'Yhdistä Tahti-tilisi',
        body: [
          'Luo tunniste kohdassa Asetukset → Tili → Kirjautuminen ja turvallisuus → API-tunnisteet. Vain luku -tunniste voi hakea ja listata tykkäyksesi ja soittolistasi; anna kirjoitusoikeus, jos työkalun pitää myös tykätä kappaleista, seurata artisteja ja luoda tai täyttää soittolistoja.',
          'Ohjaa tekoälytyökalu tunnistelistan yläpuolella näkyvään MCP-palvelimen osoitteeseen Streamable HTTP -yhteydellä ja lähetä tunniste bearer-tunnisteena. Claude Codessa: claude mcp add tahti-account --transport http <URL> --header "Authorization: Bearer <token>".',
          'Kaikki, mitä työkalu tekee, tehdään sinun nimissäsi samoin säännöin kuin sivustolla. Peru tunniste, niin pääsy katkeaa heti.',
        ],
      },
      {
        heading: 'Kytke päälle työpöytäsovelluksessa',
        body: [
          'Avaa Tahti Player -työpöytäsovellus → Asetukset → Integraatiot ja kytke MCP-palvelin päälle. Valinta muistetaan, joten palvelin käynnistyy uudelleen sovelluksen mukana.',
          'Palvelin käynnistyy osoitteessa http://127.0.0.1:8800/mcp. Jos portti on varattu, se kokeilee seuraavia porttiin 8809 asti; rivi näyttää tarkan osoitteen kopiointipainikkeen kanssa. Se vastaa vain tältä koneelta tuleviin pyyntöihin.',
          'Ohjaa tekoälytyökalu tähän osoitteeseen Streamable HTTP -yhteydellä, esimerkiksi claude mcp add tahti --transport http http://127.0.0.1:8800/mcp. Sen jälkeen se voi soittaa, pysäyttää ja ohittaa, muuttaa jonoa, hakea ja soittaa työpöytäkirjastoasi ja sen soittolistoja, virittää radion ja hakea Tahdista.',
        ],
      },
    ],
  },
  governance: {
    title: 'Hallinto jäsenille',
    description:
      'Aloitteet ja äänestykset, hallituksen keskustelut, kehitysehdotukset ja tietojen korjaaminen.',
    sections: [
      {
        heading: 'Aloitteet ja äänestykset',
        body: [
          'Avaa Hallinto (/governance; artistit löytävät sen myös kohdasta Studio → Hallinto). Aloite alkaa luonnoksena, jota jäsenet kannattavat; kun kannattajia on tarpeeksi, hallitus avaa sen äänestykseen.',
          'Lue aloite, keskustele siitä kommenteissa ja äänestä sen ollessa auki. Aloitteen sivulla näkyvät kannattajat, tulostodistus sen sulkeuduttua ja kokous, jossa se käsiteltiin.',
        ],
      },
      {
        heading: 'Keskustelut',
        body: [
          'Hallinto → Keskustelut (/governance/discussions) listaa aiheet, jotka hallitus avasi jäsenten keskusteltavaksi. Jokainen jäsen saa ilmoituksen, kun aihe avautuu.',
          'Vastaa osallistuaksesi; vastaaminen seuraa aihetta, joten saat ilmoituksen uusista vastauksista ja lista näyttää lukemattomien määrän. Hiljennä ilmoitukset jatkaa seuraamista hiljaa. Voit muokata tai poistaa oman vastauksesi aiheen ollessa auki ja ilmoittaa vastauksesta, jonka ei kuulu olla siellä. Pitkät ketjut avautuvat uusimmista vastauksista; Näytä aiemmat vastaukset lataa loput.',
          'Kirjoita vastaukseen @käyttäjänimi mainitaksesi jäsenen; hän saa ilmoituksen. Lista kertoo, kuka vastasi viimeksi, ja Merkitse kaikki luetuiksi nollaa uusien vastausten laskurit.',
          'Keskustelu ei ole äänestys: päätökset tehdään aloitteilla.',
        ],
      },
      {
        heading: 'Kehitysehdotukset',
        body: [
          'Hallinto → Kehitysehdotukset on paikka, jossa jäsenet ehdottavat ja äänestävät Tahdin parannuksista. Hallitus käy ne läpi neljännesvuosittain ja julkaisee päätöksensä.',
        ],
      },
      {
        heading: 'Tietojen korjaaminen',
        body: [
          'Onko jäsentiedoissasi tai julkaistussa tiedossa virhe? Pyydä korjausta Hallinto-sivulla; hallitus vastaa siellä, ja voit perua pyynnön sen odottaessa.',
        ],
      },
    ],
  },
  notifications: {
    title: 'Ilmoitukset',
    description:
      'Pysy kärryillä tykkäyksistä, seuraajista, käsittelyn tuloksista, viesteistä ja muusta tilisi toiminnasta.',
    sections: [
      {
        heading: 'Mitä täällä näkyy',
        body: [
          'Tilivalikon (profiilikuvasi oikeassa yläkulmassa) Ilmoitukset näyttävät tilisi kannalta tärkeät tapahtumat, kuten tykkäykset sisällöstäsi, uudet seuraajat ja valmistuneet käsittelyt. Punainen piste profiilikuvassa tarkoittaa lukematonta ilmoitusta, syaani piste lukematonta viestiä.',
          'Ilmoitusten pikanäkymän Näytä kaikki avaa sivun /notifications: suodata tyypin mukaan (Sosiaalinen, Musiikki, Raha, Hallinto, Muu) lukemattomien määrät kussakin, merkitse yksittäiset luetuiksi tai poista ne, tai Tyhjennä luetut.',
          'Käsittelyilmoitukset linkittävät valmiiseen kappaleeseen, jotta voit tarkistaa sen tiedot ja julkaisuasetukset.',
          'Vasemman yläkulman sininen valo on varattu vielä käynnissä olevalle työlle; avaa se nähdäksesi tilanteen.',
        ],
      },
    ],
  },
  'admin-guide': {
    title: 'Ylläpidon opas',
    description:
      'Kartta työkaluista, joilla hallitus ja ylläpitäjät pyörittävät Tahtia turvallisesti.',
    sections: [
      {
        heading: 'Ylläpidon alueet',
        body: [
          'Kojelauta ja Tila näyttävät alustan kunnon. Lokit näyttävät palvelujen toiminnan. Moderointi käsittelee tuki-, beta-, radio-, ilmoitus- ja kehitysehdotusjonot.',
          'Käyttäjät, Sisältö, Radio, Lähetykset, Tallennustila, Uutiset, Paikat, Kärkilistat ja Tiedotteet hallitsevat alustan arkisia osia.',
          'Hallinto ja Vuosikokous sisältävät jäsentiedot. Disco-widgetit hallitsee hyväksyttyjä lisäosia. Kansikuvapohjat hallitsee abstrakteja oletuskuvia kansikuvattomille latauksille.',
          'Hallinto → Vuosikertomukset vie vuosikertomuksen luonnoksesta hyväksytyksi, jäsenille julkaistuksi ja rekisteriin toimitetuksi; hyväksyttyä kertomusta korjataan (aiemmat versiot säilyvät), ja minkä tahansa kertomuksen voi asettaa oikeudelliseen säilytykseen.',
          'Hallinto → Hallitus kirjaa hallituskaudet (lisää tai päätä ennenaikaisesti) ja hoitaa hallitusvaalit: järjestä vaali, muokkaa tai peru se, näe ja aseta ehdokkaita ja kirjaa tulos, joka antaa jokaiselle valitulle hallituskauden.',
          'Hallinto → Tietueet sisältää jäsenten korjauspyynnöt (vastaa kuhunkin jäsenen luettavalla huomautuksella), yhdistyksen rekisteritiedot ja tilintarkastajat sekä yhden listan kaikesta oikeudellisessa säilytyksessä olevasta.',
          'Hallinto → Vuosikokous pitää kunkin kokouksen esityslistan numeroituina kohtina (lisää, muokkaa, järjestä, poista ja kirjaa päätökset), esteellisyydet, kokousten ja asiakirjojen oikeudelliset säilytykset, asiakirjojen arkistoinnin ja haettavan jäsenrekisterin.',
          'Aloitteen sivulla hallitus voi lähettää luonnoksen kannatettavaksi, viedä aloitteen kokoukseen ja sen esityslistan kohtaan sekä liittää korjauksen suljetun aloitteen tulostodistukseen.',
          'Orpo-sivut (/admin/orphan-pages) kokoaa oikeat ylläpitosivut, joilla ei ole omaa valikkokohtaa; kukin on siellä oma välilehtensä eikä katoa linkittämättömään osoitteeseen.',
        ],
      },
      {
        heading: 'Turvallisuus ja käyttöoikeudet',
        body: [
          'Ylläpitosivut vaativat valtuutetun hallitus- tai ylläpitotilin. Tee muutokset olemassa olevien lomakkeiden, vahvistusten ja auditointien kautta, jotta ne voidaan tarkistaa.',
          'Jos työkalu ei näy, tililläsi ei ehkä ole tarvittavaa roolia tai ominaisuutta ei ole vielä otettu käyttöön tuotannossa.',
        ],
      },
    ],
  },
  'disco-widgets': {
    title: 'Tee oma Disco-widget',
    description:
      'Rakenna hiekkalaatikossa toimiva lisäosa Kuuntele-sivulle, artistin kanavalle tai etusivulle ja lähetä se tarkistettavaksi.',
    sections: [
      {
        heading: '1. Rakenna se',
        body: [
          'Käytä tahti-org-repositorion @tahti/widget-sdk-pakettia. packages/widget-sdk/README.md käy läpi sopimuksen (mitä widget vie, miten se puhuu isäntäsivun kanssa ja mitkä koko- ja turvarajat koskevat sitä). packages/widget-sdk/example/live-status/ on valmis toimiva esimerkki.',
          'Widget toimii vain hiekkalaatikoidussa iframessa (ei evästeitä, ei pääsyä isäntäsivun DOMiin). Se puhuu isännän kanssa pienellä postMessage-protokollalla: ready, init, resize ja saman alkuperän open-link.',
        ],
      },
      {
        heading: '2. Avaa pull request',
        body: [
          'Haarauta tahti-org ja lisää widgetisi kansioon contrib/disco-widgets/<widgetin-tunnus>/. Mukaan src/index.ts, lyhyt README, joka kertoo käyttöalueen (kuuntelija, artisti tai ylläpito), ja sen tarvitsemat asetukset.',
          'Kerro PR:ssä, mihin se on tarkoitettu, ja anna tarkat vaiheet, joilla tarkistaja voi varmistaa sen (rakenna paketti, lataa se hiekkalaatikkoon, varmista että se näkyy edustavalla kontekstilla).',
        ],
      },
      {
        heading: '3. Mitä seuraavaksi tapahtuu',
        body: [
          'Ylläpitäjä tarkistaa koodin. Yhdistämisen jälkeen ylläpitäjä rakentaa widgetin, julkaisee sen Disco-widgetit-paneelissa ja hyväksyy sen. Sen jälkeen se on kaupassa sinun nimissäsi.',
          'Kuuntelijawidgetit asennetaan kohdasta Asetukset → Lisäosat → Löytäminen. Artistit asentavat kanavawidgetit kohdasta Asetukset → Lisäosat → Kanava; ne näkyvät osoitteissa /channel/$slug ja /u/$username.',
        ],
      },
    ],
  },
  'studio-notices': {
    title: 'Ilmoitukset Studio-työstäsi',
    description:
      'Mitä Tahti kertoo latauksista, renderöinneistä, vienneistä ja jakelusta, ja miten ne kytketään pois.',
    sections: [
      {
        heading: 'Voit poistua sivulta',
        body: [
          'Lataukset, editorin renderöinnit, raitojen erottelut, lähetysten tallenteet, viennit Mixcloudiin ja hearthis.atiin, tuonnit ja jakelu toimivat taustalla. Voit sulkea sivun; tilivalikon Ilmoitukset ja /notifications kertovat, miten kukin päättyi.',
          'Valmis työ linkittää kappaleeseen tai julkaisuun. Epäonnistunut työ merkitään Epäonnistui ja kertoo, mitä tehdä seuraavaksi.',
        ],
      },
      {
        heading: 'Mistä sinulle kerrotaan',
        body: [
          'Uusi lataus on valmis tai sitä ei voitu käsitellä. Korvaavaa versiota ei voitu käsitellä.',
          'Editorin renderöinti tai raitojen erottelu on valmis tai epäonnistui. Lähetyksen tallenne tallennettiin kappaleeksi tai luonnokseksi.',
          'Mixcloud- tai hearthis.at-vienti valmistui tai epäonnistui. Julkaisu lähetettiin jakeluun, tai sitä ei voitu lähettää. Julkaisun kappale vastaa AcoustIDistä jo löytyvää äänitettä.',
          'Tuonti SoundCloudista, Google Drivesta tai hearthis.atista epäonnistui. Automaattinen somepäivitys ei lähtenyt. Jäsenyytesi päättyi.',
        ],
      },
      {
        heading: 'Kytke ne pois',
        body: [
          'Asetukset → Ilmoitukset → Studio-työ sisältää Sovelluksessa-kytkimen näille ilmoituksille. Jäsenyys- ja maksuilmoitukset noudattavat sen sijaan Tulojen liikkeet -asetusta.',
        ],
      },
    ],
  },
  'account-security': {
    title: 'Pidä tilisi turvassa',
    description:
      'Vaihda salasana tai sähköposti, käytä kaksivaiheista kirjautumista ja tiedä, mistä muutoksista lähetämme sähköpostia.',
    sections: [
      {
        heading: 'Salasana ja sähköposti',
        body: [
          'Vaihda salasanasi kohdassa Asetukset → Tili → Salasana ja sähköposti. Tarvitset nykyisen salasanan; kaikki muut laitteet kirjataan ulos, ja aiemmin lähetetyt salasanan palautuslinkit lakkaavat toimimasta.',
          'Vaihtaaksesi sähköpostin kirjoita uusi osoite ja salasanasi. Lähetämme linkin uuteen osoitteeseen, eikä mikään muutu ennen kuin se avataan (24 tunnin sisällä). Nykyiseen osoitteeseesi ilmoitetaan heti, ja voit perua odottavan muutoksen samassa paikassa.',
          'Salasanassa on oltava vähintään 10 merkkiä, pieni kirjain, iso kirjain ja numero.',
        ],
      },
      {
        heading: 'Kaksivaiheinen kirjautuminen, laitteet ja tunnisteet',
        body: [
          'Kytke kaksivaiheinen kirjautuminen päälle kohdassa Asetukset → Tili → Kaksivaiheinen tunnistautuminen ja säilytä varakoodit turvallisessa paikassa.',
          'Asetukset → Tili → Laitteet listaa kaikki kirjautuneet laitteet; kirjaa ulos yksi tai kaikki.',
          'API-tunnisteet antavat skripteille pääsyn tiliisi. Peru ne, joita et enää käytä.',
        ],
      },
      {
        heading: 'Tiliäsi koskevat sähköpostit',
        body: [
          'Lähetämme sähköpostia tilisi osoitteeseen, kun: salasanasi vaihdetaan tai palautetaan; sähköpostin vaihtoa pyydetään ja kun se on tehty (vanhaan osoitteeseen); kaksivaiheinen kirjautuminen kytketään päälle tai pois; uusi laite kirjautuu ensimmäistä kertaa; uusi API-tunniste luodaan; hallitus jäädyttää tilin tai palauttaa sen.',
          'Jos joku näistä ei ollut sinä, vaihda salasanasi heti ja kirjoita osoitteeseen support@tahti.live.',
        ],
      },
    ],
  },
  support: {
    title: 'Ota yhteyttä tukeen',
    description:
      'Tavoita Tahdin tiimi tiliin, laskutukseen tai tekniseen ongelmaan liittyen.',
    sections: [
      {
        heading: 'Hae apua',
        body: [
          'Käytä alla olevaa lomaketta tiliin, laskutukseen, osallistumiseen tai tekniikkaan liittyvissä asioissa.',
          'Kirjoita lyhyt kuvaus, jotta tiimi voi auttaa nopeasti. Kirjautuneena pyynnöt käyttävät tilisi sähköpostia automaattisesti.',
          'Aiemmat pyyntösi näkyvät vastauksineen. Merkitse ratkaistuksi sulkee pyynnön, kun asia on hoidettu; ratkaistuun pyyntöön vastaaminen avaa sen uudelleen.',
        ],
      },
    ],
  },
};
