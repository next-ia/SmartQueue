"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, Users, CheckCircle, QrCode } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';

export default function Home() {
  const [baseUrl, setBaseUrl] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const initUrl = () => {
      setBaseUrl(window.location.origin);
      setMounted(true);
    };
    initUrl();
  }, []);

  const registerUrl = baseUrl ? `${baseUrl}/register` : '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 to-blue-800 flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-2xl w-full bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="bg-blue-600 p-8 text-center text-white">
          <h1 className="text-4xl font-extrabold mb-2">SmartQueue Maroc</h1>
          <p className="text-blue-100 text-lg">La solution moderne pour la gestion des patients</p>
        </div>
        
        <div className="p-8">
          {/* QR Code Section */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8">
            <div className="flex flex-col md:flex-row items-center justify-center gap-6">
              <div className="bg-white p-4 rounded-lg shadow-sm">
                {mounted && registerUrl ? (
                  <QRCodeSVG 
                    value={registerUrl} 
                    size={120} 
                    level={"H"}
                    includeMargin={true}
                  />
                ) : (
                  <div className="w-[120px] h-[120px] flex items-center justify-center bg-gray-100 rounded">
                    <QrCode className="w-8 h-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="text-center md:text-left">
                <h3 className="font-bold text-gray-800 mb-1">Scannez pour prendre un ticket</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Patients, scannez ce QR Code pour rejoindre la file d&apos;attente
                </p>
                <p className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">
                  {mounted ? registerUrl : 'Chargement...'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="flex flex-col items-center text-center p-4 bg-blue-50 rounded-xl">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <Calendar className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Secrétaire</h3>
              <p className="text-sm text-gray-600">Gérez votre file d&apos;attente en temps réel</p>
              <Link href="/dashboard-secretaire" className="mt-4 w-full">
                <Button 
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={() => console.log('Navigation vers /dashboard-secretaire')}
                >
                  Accéder au Dashboard
                </Button>
              </Link>
            </div>

            <div className="flex flex-col items-center text-center p-4 bg-green-50 rounded-xl">
              <div className="bg-white p-3 rounded-full shadow-sm mb-3">
                <Users className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">Patient</h3>
              <p className="text-sm text-gray-600">Rejoignez la file d&apos;attente</p>
              <Link href="/register" className="mt-4 w-full">
                <Button 
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  onClick={() => console.log('Navigation vers /register')}
                >
                  Prendre un ticket
                </Button>
              </Link>
            </div>
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4 text-center">Fonctionnalités Clés</h2>
            
            <div className="flex items-start space-x-4">
              <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">File d&apos;Attente Dynamique</h4>
                <p className="text-gray-600 text-sm">Gestion visuelle et intuitive de la file d&apos;attente</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <Clock className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">Temps d&apos;Attente Estimé</h4>
                <p className="text-gray-600 text-sm">Transparence totale pour le patient</p>
              </div>
            </div>

            <div className="flex items-start space-x-4">
              <QrCode className="w-6 h-6 text-green-500 flex-shrink-0 mt-1" />
              <div>
                <h4 className="font-semibold text-gray-800">QR Code Dynamique</h4>
                <p className="text-gray-600 text-sm">S&apos;adapte automatiquement à votre URL (localhost ou Vercel)</p>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 border-t border-gray-100">
          © 2025 SmartQueue Maroc. Tous droits réservés.
        </div>
      </div>
    </div>
  );
}
