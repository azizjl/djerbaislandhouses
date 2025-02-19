import { Link } from 'react-router-dom'

const TermsOfService = () => {
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
          
          <h1 className="text-3xl font-bold text-[#1B4965] mb-6">Terms of Service (Conditions d'Utilisation)</h1>
          
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">Introduction</h2>
              <p>En utilisant notre plateforme de réservation, vous acceptez ces Conditions d'Utilisation.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">1. Accès et Utilisation</h2>
              <ul className="list-disc ml-6 mt-2">
                <li>Vous devez fournir des informations exactes lors de la création de votre compte.</li>
                <li>Vous acceptez d'utiliser la plateforme uniquement à des fins légales.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">2. Réservations et Paiements</h2>
              <ul className="list-disc ml-6 mt-2">
                <li>Toutes les réservations sont soumises à disponibilité.</li>
                <li>Le paiement doit être effectué selon les modalités indiquées.</li>
                <li>Les réservations peuvent être annulées conformément à notre politique d'annulation.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">3. Annulation et Remboursements</h2>
              <ul className="list-disc ml-6 mt-2">
                <li>Les annulations sont possibles selon les délais mentionnés pour chaque réservation.</li>
                <li>Des frais peuvent s'appliquer en cas d'annulation tardive.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">4. Responsabilités de l'Utilisateur</h2>
              <ul className="list-disc ml-6 mt-2">
                <li>Vous êtes responsable de l'exactitude des informations fournies.</li>
                <li>Toute utilisation abusive de la plateforme entraînera la suspension de votre compte.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">5. Limitation de Responsabilité</h2>
              <p>Nous ne sommes pas responsables des dommages indirects ou imprévus liés à l'utilisation de notre plateforme.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">6. Modification des Conditions</h2>
              <p>Nous nous réservons le droit de modifier ces termes à tout moment. Les modifications seront notifiées aux utilisateurs.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">7. Droit applicable</h2>
              <p>Ces conditions sont régies par les lois tunisiennes. Tout litige sera soumis à la juridiction des tribunaux compétents de Tunis.</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#1B4965] mb-3">8. Contact</h2>
              <p>Pour toute question sur ces conditions, vous pouvez nous contacter à :</p>
              <p className="mt-2">Email : support@djerbaislandhouses.com</p>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService 