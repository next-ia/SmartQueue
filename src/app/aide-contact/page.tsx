export default function AideContact() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Aide & Contact
        </h1>
        
        <div className="bg-white rounded-xl shadow-lg p-8 mb-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Questions Fréquentes</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Comment prendre un rendez-vous ?</h3>
              <p className="text-gray-600">
                Utilisez la page d'accueil pour scanner un QR code ou suivez les instructions affichées dans le cabinet médical.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Comment consulter ma position dans la file ?</h3>
              <p className="text-gray-600">
                Un QR code vous sera attribué lors de votre enregistrement. Scannez-le à tout moment pour voir votre position estimée.
              </p>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Que faire si je manque mon tour ?</h3>
              <p className="text-gray-600">
                Si vous manquez votre appel, rapprochez-vous de l'accueil. Le personnel médical pourra vous reprogrammer.
              </p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Nous Contacter</h2>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-gray-500 mr-3">📧</span>
              <a href="mailto:support@smartqueue.ma" className="text-blue-600 hover:underline">
                support@smartqueue.ma
              </a>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-3">📞</span>
              <span className="text-gray-600">+212 5XX XXX XXX</span>
            </div>
            
            <div className="flex items-center">
              <span className="text-gray-500 mr-3">🕐</span>
              <span className="text-gray-600">Lun-Ven: 9h-18h</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
