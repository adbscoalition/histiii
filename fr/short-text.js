const pairs=text=>Object.fromEntries(text.trim().split('\n').map(line=>{const[id,...pair]=line.split('|');return[id,pair];}));
export const TEXT_120=pairs(`
A1-001|Loisirs et centres d’intérêt actuels|Loisirs réguliers, centres d’intérêt actuels et activités choisies pendant votre temps libre.
A1-002|Goûts musicaux|Genres, préférences d’écoute et goûts musicaux généraux.
A1-003|Artistes préférés|Partageriez-vous les noms de vos musiciens ou artistes préférés ?
A1-004|Films et séries|Types de films ou de séries regardés et préférences générales de visionnage.
A1-005|Film ou série préféré|Partageriez-vous un film ou une série préféré en particulier ?
A1-006|Lecture, livres et auteurs préférés|Ce que vous lisez, vos livres ou auteurs préférés et votre fréquence de lecture.
A1-007|Habitudes et fréquence de jeu|Jeux auxquels vous jouez ou que vous suivez et fréquence de jeu.
A1-008|Sports, exercice et forme physique|Sports pratiqués, routines d’exercice, intérêts et objectifs de forme physique.
A1-009|Création, photographie et travaux manuels|Loisirs créatifs tels que l’art, les travaux manuels, la photographie ou la fabrication d’objets.
A1-010|Alimentation, cuisine et restaurants|Habitudes de cuisine et de repas à l’extérieur, aliments détestés, préférences alimentaires et de restaurants.
A1-011|Plats préférés|Partageriez-vous des plats préférés précis ?
A1-012|Sommeil et routine quotidienne|Horaires de sommeil, routines du matin et du soir et structure d’une journée type.
A1-013|Week-ends, vie sociale et activités familiales|Projets de week-end, concerts ou événements, projets sociaux et activités en famille ou entre amis.
A1-014|Transport et déplacements|Préférences de transport et façon générale de vous déplacer.
A1-015|Achats, vêtements et marques|Habitudes d’achat, style vestimentaire et marques préférées.
A1-016|Technologie, applications et temps d’écran|Préférences technologiques, applications utilisées et habitudes générales de temps d’écran.
A1-017|Réseaux sociaux utilisés|Diriez-vous quels réseaux sociaux vous utilisez ?
A1-018|Publications et utilisation des réseaux sociaux|Fréquence de vos publications ou interactions publiques sur les réseaux sociaux.
A1-019|Podcasts et actualité|Podcasts, sujets d’actualité et sources d’information que vous suivez.
A1-020|Envies de voyage et style de vacances|Où et comment vous aimez voyager et quel style de vacances vous préférez.
A1-021|Voyages récents, en général|Diriez-vous avoir voyagé récemment, sans devoir donner de détails d’itinéraire ?
A1-022|Animaux, plantes et entretien du foyer|Animaux et leurs routines, soin des plantes et préférences ordinaires de logement ou de décoration.
A1-023|Saisons, activités et lieux locaux|Activités saisonnières, préférences d’intérieur ou de plein air, météo et types de lieux locaux préférés.
A1-024|Bénévolat, clubs et communautés|Intérêts bénévoles, clubs, communautés et participation à des groupes organisés.
A1-025|Cours et leçons|Diriez-vous quels cours, leçons ou formations vous suivez actuellement ?
A1-026|Apprentissage, travail, projets et objectifs|Habitudes d’étude et d’apprentissage, horaires de travail, routines de productivité, projets actuels et objectifs personnels.
A1-027|Télétravail ou travail sur place|Diriez-vous si vous préférez le travail à distance, hybride ou sur place ?
A1-028|Mode de communication préféré|Diriez-vous comment vous préférez être contacté ou communiquer ?
A2-001|Fiançailles ou mariage|Une étape importante d’engagement, telle que des fiançailles ou un mariage.
A2-002|Séparation ou divorce|La fin d’une relation par séparation ou divorce.
A2-003|Nouvelle relation sérieuse ou rupture|Le début d’une relation sérieuse ou une rupture importante.
A2-004|Grossesse ou naissance|Grossesse, naissance ou fait de devenir parent par la naissance d’un enfant.
A2-005|Traitement de fertilité ou adoption|Adoption, traitement de fertilité ou autre parcours important vers la parentalité.
A2-006|Perte de grossesse|Fausse couche, enfant mort-né ou autre perte de grossesse.
A2-007|Devenir proche aidant|Assumer une responsabilité importante et durable de soins envers une autre personne.
A2-008|Deuil|Décès d’un membre de la famille immédiate, d’un parent ou d’un ami proche.
A2-009|Déménagement important|Un déménagement important, notamment dans une autre ville, région ou un autre pays.
A2-010|Achat ou vente d’un logement|Acheter, vendre ou vivre une autre transition majeure de logement.
A2-011|Transition importante dans les études|Commencer des études supérieures, obtenir un diplôme ou quitter un cursus diplômant.
A2-012|Nouvel emploi ou promotion|Commencer un nouvel emploi ou recevoir une promotion importante.
A2-013|Perte d’emploi|Perdre un emploi ou être licencié.
A2-014|Reconversion ou retraite|Changer de carrière ou prendre sa retraite.
A2-015|Création ou fermeture d’entreprise|Créer, posséder ou fermer une entreprise.
A2-016|Prix, reconnaissance ou réussite importante|Recevoir un prix important, une reconnaissance publique ou atteindre un grand objectif personnel.
A2-017|Échec personnel important|Un échec ou un revers personnel que vous jugez important.
A2-018|Gain financier exceptionnel|Un héritage important, un prix, un gain de placement ou autre gain financier exceptionnel.
A2-019|Revers financier ou faillite|Une forte perte financière, une crise d’endettement ou une faillite.
A2-020|Litige juridique important|Une poursuite, un conflit juridique ou un autre litige majeur.
A2-021|Hospitalisation, opération, blessure ou longue convalescence|Un problème de santé grave nécessitant hospitalisation, opération ou convalescence prolongée.
A2-022|Diagnostic important|Recevoir un diagnostic médical grave ou qui change la vie.
A2-023|Maladie grave d’un proche|Hospitalisation ou diagnostic important d’un membre de la famille.
A2-024|Évacuation ou dégâts au logement|Évacuation à cause d’une catastrophe ou dégâts importants au logement.
B-001|Prénom seul|Partageriez-vous uniquement votre prénom ?
B-002|Nom légal complet|Nom légal complet, nom de famille compris ; ne comprend pas la question distincte sur le prénom seul.
B-003|Âge et année de naissance|Tranche d’âge, âge exact ou année de naissance.
B-004|Date de naissance complète|Mois et jour de naissance et date de naissance complète.
B-005|Pronoms et genre|Pronoms et informations sur le genre.
B-006|Nationalité et pays de naissance|Nationalité ou citoyenneté et pays de naissance.
B-007|Ville d’origine et ville ou région actuelle|Ville d’origine et lieu de résidence actuel général, au niveau de la ville, de l’État ou de la région.
B-008|Fuseau horaire|Partageriez-vous votre fuseau horaire actuel ?
B-009|Téléphone personnel|Un numéro personnel permettant de vous contacter directement.
B-010|Adresses e-mail personnelles|Adresses e-mail personnelles principales ou secondaires.
B-011|Identifiants et profils publics en ligne|Noms d’utilisateur, identifiants de réseaux sociaux, photo de profil, site personnel ou profil professionnel.
B-012|Profession et poste|Votre profession et l’intitulé de votre poste actuel.
B-013|Secteur d’activité|Partageriez-vous votre secteur d’activité ou domaine professionnel général ?
B-014|Nom de l’employeur|Nom de votre employeur ou organisation actuel.
B-015|École ou université|École, établissement supérieur ou université que vous fréquentez ou avez fréquenté.
B-016|Détails des études|Niveau d’études, domaine d’études et année d’obtention du diplôme.
B-017|Situation amoureuse ou état civil|Situation amoureuse ou état civil actuel.
B-018|Foyer et structure familiale|Nombre de personnes du foyer et présence ou non d’enfants.
B-019|Nombre de frères et sœurs|Diriez-vous combien de frères et sœurs vous avez ?
B-020|Langues parlées|Langues que vous parlez ou utilisez régulièrement.
C-001|Précision du lieu de résidence|Précision avec laquelle vous indiqueriez où vous vivez, d’une vaste région au quartier ou à une zone de précision comparable.
C-002|Adresse personnelle complète|Numéro de maison ou d’immeuble, numéro d’appartement ou de logement et adresse complète.
C-003|Position précise actuelle ou en direct|Votre position actuelle exacte ou accès à votre localisation en direct.
C-004|Historique des lieux visités|Relevé des lieux où vous êtes allé au fil du temps.
C-005|Lieu de travail, trajet et horaires exacts|Adresse du travail, trajet habituel et emploi du temps quotidien exact ou routine prévisible.
C-006|Voyage à venir et réservations|Dates de voyage, itinéraire, hébergement et détails des vols ou trains à venir.
C-007|Tranche de revenus ou salaire exact|Votre tranche de revenus ou salaire exact.
C-008|Épargne et soldes de comptes|Tranche d’épargne ou de solde de compte.
C-009|Dettes et paiements de logement|Montant des dettes et du loyer ou du prêt immobilier.
C-010|Score de crédit|Votre score de crédit personnel.
C-011|Historique des achats|Historique des achats importants et des achats ordinaires.
C-012|Conflits de couple ou de famille|Conflits, désaccords ou tensions privés dans les relations amoureuses ou familiales.
C-013|Photos privées|Photos privées non destinées à un large public.
C-014|Messages privés et e-mails|Contenu de messages directs privés, de conversations par SMS ou d’e-mails.
C-015|Historiques de navigation et de recherche|Historique du navigateur et des requêtes de recherche.
C-016|Utilisation détaillée des applications|Journaux ou habitudes détaillés d’utilisation des applications.
C-017|Rencontres amoureuses|Activité sur des applications de rencontres, rendez-vous ou autres comportements privés de rencontres.
C-018|Orientation sexuelle|Informations privées sur l’orientation sexuelle.
C-019|Convictions religieuses|Convictions et appartenances religieuses ou spirituelles.
C-020|Opinions politiques|Opinions, affiliations politiques ou positions relatives au vote.
C-021|Détails de litiges juridiques|Détails privés d’une poursuite, d’un litige ou d’une autre affaire juridique.
C-022|Dossiers scolaires ou professionnels|Notes scolaires ou évaluation des performances au travail.
C-023|Sécurité du domicile|Détails sur les serrures, alarmes, caméras, systèmes d’accès ou autres mesures de sécurité du domicile.
C-024|Réseau de contacts proches|Informations identifiant les personnes avec lesquelles vous communiquez ou sur lesquelles vous comptez le plus souvent.
D-001|Identifiant fiscal ou social officiel|Numéro de sécurité sociale américain, identifiant fiscal ou identifiant fiscal ou social officiel équivalent.
D-002|Numéro de permis ou de passeport|Numéro de permis de conduire, de passeport ou de pièce d’identité officielle similaire.
D-003|Image d’identité officielle ou dossier de vérification|Image d’une pièce d’identité officielle ou ensemble de documents de vérification d’identité.
D-004|Numéros de compte et d’acheminement bancaire|Numéros identifiant un compte bancaire ou permettant d’y acheminer des fonds.
D-005|Numéro de carte de débit ou de crédit|Numéro complet d’une carte de débit ou de crédit.
D-006|Code de sécurité ou PIN de paiement|Code de sécurité de carte (CVV/CVC) ou code PIN de carte de paiement.
D-007|Identifiants de banque en ligne|Nom d’utilisateur et/ou mot de passe de banque en ligne.
D-008|Mots de passe de comptes personnels|Mots de passe de messagerie, réseaux sociaux, achats, stockage en ligne ou autres comptes personnels.
D-009|Codes multifacteurs ou de récupération|Codes d’authentification à usage unique, de récupération ou d’accès de secours.
D-010|Réponses aux questions de sécurité|Réponses utilisées pour vérifier l’identité ou récupérer un compte.
D-011|Phrase de récupération ou clé privée de cryptomonnaie|Phrase de départ ou de récupération d’un portefeuille de cryptomonnaie, ou clé cryptographique privée.
D-012|Déclaration ou formulaires fiscaux|Déclaration fiscale complète ou formulaires fiscaux détaillés.
D-013|Relevé bancaire complet|Relevé bancaire complet indiquant opérations, soldes et détails du compte.
D-014|Bilan du patrimoine ou relevé de placements|Bilan détaillé du patrimoine ou relevé d’un compte de placement.
D-015|Dossier médical complet|Dossier médical complet ou presque complet.
D-016|Diagnostics précis|Diagnostics ou affections médicaux précis.
D-017|Liste de médicaments prescrits|Liste des médicaments prescrits.
D-018|Dossier de santé mentale ou psychothérapie|Dossiers de santé mentale ou notes de psychothérapie.
D-019|Tests génétiques ou profil ADN|Résultats de tests génétiques ou profil ADN.
D-020|Identifiants biométriques|Modèles ou données biométriques d’empreintes digitales, du visage ou de la voix.
D-021|Identifiants d’assurance maladie ou de compte médical|Identifiants d’adhérent à une assurance maladie ou numéros de compte médical.
D-022|Résultats de laboratoire détaillés|Résultats détaillés de laboratoire ou d’anatomopathologie.
D-023|Imagerie médicale|Images ou comptes rendus de radiographie, scanner, IRM ou échographie.
D-024|Rapport de vérification d’antécédents|Rapport détaillé de vérification ou de contrôle des antécédents.
`);
export const TEXT_60=pairs(`
A1-001|Loisirs, centres d’intérêt et activités créatives|Loisirs réguliers, centres d’intérêt actuels et activités créatives comme l’art, les travaux manuels, la photographie ou la fabrication d’objets.
A1-002|Musique, podcasts et actualité|Goûts musicaux, podcasts, sujets d’actualité et sources d’information que vous suivez.
A1-003|Artiste, film ou série préféré|Diriez-vous le nom d’un musicien ou artiste préféré, ou d’un film ou d’une série préféré précis ?
A1-004|Films, séries, lecture et jeux|Préférences de visionnage, habitudes et favoris de lecture, jeux auxquels vous jouez ou que vous suivez.
A1-005|Sports, exercice et forme physique|Sports pratiqués ou suivis, routines d’exercice, intérêts et objectifs de forme physique.
A1-006|Alimentation, cuisine et restaurants|Habitudes de cuisine et de repas à l’extérieur, plats préférés, aliments détestés, préférences alimentaires et de restaurants.
A1-007|Sommeil, quotidien, week-ends et vie sociale|Horaires de sommeil, routines du matin et du soir, journée type, activités du week-end et projets sociaux ou familiaux ordinaires.
A1-008|Transports, achats, vêtements et marques|Façon de vous déplacer, habitudes d’achat, style vestimentaire et marques préférées.
A1-009|Technologie, applications, écrans et publications|Préférences technologiques, applications utilisées, temps d’écran et fréquence de publication ou d’interaction publique.
A1-010|Réseaux sociaux utilisés|Diriez-vous quels réseaux ou services de médias sociaux vous utilisez ?
A1-011|Envies de voyage, vacances et voyages récents|Où et comment vous aimez voyager, style de vacances et fait d’avoir voyagé récemment, en général.
A1-012|Animaux, foyer, saisons et lieux locaux|Animaux, routines de soin des plantes et du foyer, goûts de décoration, activités saisonnières, préférences d’intérieur ou de plein air, météo et types de lieux locaux préférés.
A1-013|Communauté, apprentissage, travail, projets et objectifs|Bénévolat ou clubs, cours ou leçons, habitudes d’apprentissage, routines ou modes de travail, productivité, projets actuels et objectifs personnels.
A1-014|Mode de communication préféré|Diriez-vous comment vous préférez être contacté ou communiquer ?
A2-001|Engagement important ou nouvelle relation sérieuse|Fiançailles, mariage ou début d’une relation amoureuse sérieuse.
A2-002|Séparation, divorce ou rupture sérieuse|Fin d’une relation importante par séparation, divorce ou rupture.
A2-003|Grossesse, naissance, fertilité ou adoption|Transition majeure vers la parentalité liée à une grossesse, une naissance, un traitement de fertilité ou une adoption.
A2-004|Perte de grossesse ou deuil|Perte d’une grossesse ou décès d’une personne importante pour vous.
A2-005|Aide à un proche ou maladie grave d’un proche|Devenir proche aidant ou faire face à une maladie grave touchant un membre proche de la famille.
A2-006|Déménagement, logement, évacuation ou dégâts|Déménagement, achat ou vente d’un logement, évacuation après une catastrophe ou dégâts importants au domicile.
A2-007|Étape d’études importante, prix ou réussite|Commencer ou terminer une grande étape d’études, recevoir une reconnaissance importante ou atteindre un objectif majeur.
A2-008|Nouvel emploi, promotion, reconversion ou retraite|Transition professionnelle importante, positive ou prévue, telle qu’un nouvel emploi, une promotion, une reconversion ou une retraite.
A2-009|Perte d’emploi ou création/fermeture d’entreprise|Perdre un emploi ou créer ou fermer une entreprise, comme transition professionnelle majeure.
A2-010|Gain financier, revers ou faillite|Gain financier important ou revers financier majeur, faillite comprise.
A2-011|Échec personnel ou litige juridique important|Échec personnel important ou litige juridique majeur.
A2-012|Hospitalisation, opération, blessure ou diagnostic important|Événement majeur de santé impliquant hospitalisation, opération, blessure grave ou convalescence, ou diagnostic important.
B-001|Prénom seul|Diriez-vous uniquement votre prénom ?
B-002|Nom légal complet|Votre nom légal complet, nom de famille compris.
B-003|Âge et date de naissance|Âge, année de naissance et date de naissance complète.
B-004|Pronoms, genre, nationalité, naissance et langues|Informations démographiques ou personnelles de base : pronoms, genre, nationalité, pays de naissance et langues parlées.
B-005|Ville d’origine, région actuelle et fuseau horaire|Diriez-vous votre ville d’origine ou ville ou région actuelle ainsi que votre fuseau horaire, sans adresse de rue ?
B-006|Téléphone et e-mails personnels|Numéro de téléphone personnel et adresse ou adresses e-mail personnelles.
B-007|Identifiants en ligne et liens de profils publics|Partageriez-vous des noms d’utilisateur, des identifiants ou des liens vers des profils publics en ligne ?
B-008|Profession, poste, secteur et employeur|Profession, intitulé de poste, secteur d’activité et nom de l’employeur.
B-009|École, université et études|Nom de l’école ou université, niveau d’études ou parcours de formation.
B-010|Situation amoureuse et structure du foyer|Situation amoureuse ou état civil, structure du foyer ou de la famille et informations sur les frères et sœurs.
C-001|Précision du lieu de résidence et adresse complète|Précision avec laquelle vous indiqueriez votre lieu de résidence, jusqu’à l’adresse complète et le numéro de logement inclus.
C-002|Localisation actuelle ou en direct et historique|Position actuelle exacte ou en direct et relevé des lieux où vous êtes allé au fil du temps.
C-003|Travail, trajet, horaires et itinéraire de voyage|Lieu de travail, trajet habituel ou horaires exacts, et itinéraire ou réservations de voyage à venir.
C-004|Revenus, salaire, épargne et soldes|Revenus ou salaire exact, ainsi qu’épargne et soldes de comptes.
C-005|Dettes, paiements de logement et score de crédit|Montant des dettes ou des paiements de logement et score de crédit.
C-006|Historiques d’achats, de navigation, de recherche et d’applications|Relevés d’achats, de navigation et de recherche, et utilisation détaillée des applications.
C-007|Conflits de couple ou de famille et rencontres|Conflits privés de couple ou de famille et activité de rencontres amoureuses.
C-008|Photos privées et contenu de messages ou d’e-mails|Photos privées et contenu des messages ou e-mails privés.
C-009|Orientation sexuelle, religion et opinions politiques|Informations personnelles sur l’orientation sexuelle, la religion et les opinions politiques.
C-010|Litige juridique et dossiers scolaires ou professionnels|Détails d’un litige juridique et dossiers évaluant les résultats scolaires ou professionnels.
C-011|Sécurité du domicile|Détails sur alarmes, caméras, serrures, accès et autres mesures de sécurité du domicile.
C-012|Réseau de contacts proches|Informations identifiant les personnes avec lesquelles vous communiquez, sur lesquelles vous comptez ou que vous fréquentez le plus souvent.
D-001|Identifiant fiscal ou social et numéro d’identité officiel|Identifiant de sécurité sociale ou fiscal, ainsi que numéro de permis, de passeport ou de pièce d’identité officielle similaire.
D-002|Image d’identité, dossier de vérification ou rapport d’antécédents|Image ou ensemble de documents de vérification d’identité, ou rapport détaillé de vérification des antécédents.
D-003|Numéros de compte, d’acheminement et de cartes bancaires|Numéros de compte et d’acheminement bancaire, ainsi que numéros complets de carte de débit ou de crédit.
D-004|PIN, CVV et identifiants de banque en ligne|Code PIN ou code de sécurité de carte, ainsi que nom d’utilisateur et mot de passe de banque en ligne.
D-005|Mots de passe et codes multifacteurs ou de récupération|Mots de passe de comptes personnels et codes d’authentification à usage unique, de secours ou de récupération.
D-006|Réponses de sécurité et phrases ou clés de cryptomonnaie|Réponses aux questions de sécurité et phrases de départ ou de récupération de cryptomonnaie ou clés cryptographiques privées.
D-007|Déclarations fiscales et relevés bancaires complets|Déclaration fiscale ou formulaires fiscaux complets, ou relevés bancaires complets indiquant soldes et opérations.
D-008|Bilan du patrimoine ou relevé de placements|Bilan détaillé du patrimoine ou relevé de compte de placement.
D-009|Dossier médical complet et diagnostics précis|Dossier médical complet ou presque complet et diagnostics ou affections précis.
D-010|Prescriptions et dossiers de santé mentale ou psychothérapie|Informations sur les médicaments prescrits et dossiers de santé mentale ou notes de psychothérapie.
D-011|Génétique, ADN et identifiants biométriques|Tests génétiques ou ADN et modèles ou données biométriques d’empreintes digitales, du visage ou de la voix.
D-012|Identifiants médicaux, laboratoire et imagerie|Identifiants d’assurance maladie ou de compte médical, résultats détaillés de laboratoire ou d’anatomopathologie, et dossiers d’imagerie médicale.
`);
