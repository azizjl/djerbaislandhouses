import { Link } from 'react-router-dom'

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen relative">
      {/* Gradient Background */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#1B4965] via-[#62B6CB] to-[#BEE9E8] opacity-20"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-20 container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto bg-white/95 backdrop-blur-sm p-8 rounded-2xl shadow-xl">
          <div className="flex items-center justify-between mb-8">
            <Link to="/" className="inline-block">
              <img src="/logo.svg" alt="DjerbaIsland Houses" className="h-12 w-auto" />
            </Link>
            <Link 
              to="/" 
              className="px-4 py-2 bg-[#1B4965] text-white rounded-lg hover:bg-[#62B6CB] transition-colors duration-300"
            >
              Retour à l'accueil
            </Link>
          </div>
          
          <h1 className="text-3xl font-bold text-[#1B4965] mb-6">Politique de Confidentialité</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <p className="mb-4">Cette politique de confidentialité explique comment DJERBA ISLAND HOUSES collecte, utilise et protège les informations personnelles des utilisateurs lorsqu'ils accèdent à notre plateforme de réservation.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">1. Données collectées</h2>
              <p>Nous collectons les types de données suivants :</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Données personnelles : Nom, prénom, adresse e-mail, numéro de téléphone</li>
                <li>Informations de réservation : Propriété réservée, dates de séjour, montants payés</li>
                <li>Données de paiement : Méthode de paiement utilisée, statut des transactions</li>
                <li>Données techniques : Adresse IP, type de navigateur, et informations sur l'appareil utilisé</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">2. Utilisation des données</h2>
              <p>Vos informations sont utilisées pour :</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Gérer vos réservations et paiements</li>
                <li>Améliorer nos services et l'expérience utilisateur</li>
                <li>Vous envoyer des communications importantes liées à vos réservations</li>
                <li>Respecter les obligations légales et fiscales</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">3. Partage des données</h2>
              <p>Nous pouvons partager vos informations avec :</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Partenaires tiers pour les paiements et la synchronisation avec d'autres plateformes (ex. Airbnb, Booking.com)</li>
                <li>Autorités légales en cas de nécessité</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">4. Sécurité des données</h2>
              <p>Nous appliquons des mesures de sécurité pour protéger vos données contre tout accès non autorisé.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">5. Vos droits</h2>
              <p>Vous avez le droit de :</p>
              <ul className="list-disc ml-6 mt-2">
                <li>Accéder à vos données personnelles</li>
                <li>Demander leur rectification ou suppression</li>
                <li>Retirer votre consentement à tout moment</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">6. Contact</h2>
              <p>Pour toute question concernant cette politique, vous pouvez nous contacter à :</p>
              <p className="mt-2">Email : support@djerbaislandhouses.com</p>
              <p>Adresse : 002, Mohamed Badra, Montplaisir, Tunis 1073</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy 