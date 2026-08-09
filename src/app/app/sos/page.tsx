"use client";

import { Siren, Phone, MapPin, ArrowLeft, MessageCircle, AlertTriangle, Shield, Share2 } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import BottomNav from "@/components/BottomNav";

const emergencyContacts = [
  { name: "Police", number: "999", desc: "National Emergency", color: "bg-blue-50 text-blue-600" },
  { name: "Women Support", number: "109", desc: "Violence Helpline", color: "bg-rose-50 text-rose-600" },
  { name: "Fire Service", number: "9555555", desc: "Fire Emergency", color: "bg-orange-50 text-orange-600" },
  { name: "Ambulance", number: "199", desc: "Medical Emergency", color: "bg-green-50 text-green-600" },
];

export default function SOSPage() {
  const [activated, setActivated] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [pulses, setPulses] = useState<number[]>([]);

  useEffect(() => {
    if (!activated) return;
    let count = 5;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [activated]);

  const triggerSOS = () => {
    if (!activated) {
      setActivated(true);
      setPulses([1, 2, 3]);
    }
  };

  return (
    <div className="mobile-container bg-gray-50">
      {/* Header */}
      <header className="bg-gradient-to-r from-red-500 to-red-600 text-white p-4 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <Link href="/app" className="p-2 hover:bg-white/20 rounded-xl">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Emergency SOS</h1>
        </div>
      </header>

      <div className="p-4 space-y-5 pb-24">
        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-amber-800">Emergency Only</p>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Use this feature only in real emergencies. Your location will be shared with emergency contacts.
            </p>
          </div>
        </div>

        {/* SOS Button */}
        <div className="flex flex-col items-center py-4">
          {!activated ? (
            <div className="relative">
              {pulses.map((p) => (
                <div key={p} className="absolute inset-0 rounded-full bg-red-400 sos-pulse" style={{ animationDelay: `${p * 0.3}s` }} />
              ))}
              <button
                onClick={triggerSOS}
                className="relative w-52 h-52 rounded-full bg-gradient-to-br from-red-500 to-red-600 shadow-2xl shadow-red-300 flex flex-col items-center justify-center active:scale-95 transition-transform border-4 border-white"
              >
                <Siren className="w-14 h-14 text-white mb-2" />
                <span className="text-white font-extrabold text-2xl">SOS</span>
                <span className="text-red-100 text-xs font-medium mt-1">Tap to Alert</span>
              </button>
            </div>
          ) : countdown > 0 ? (
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-amber-400 to-amber-500 shadow-2xl shadow-amber-300 flex flex-col items-center justify-center border-4 border-white">
              <span className="text-white font-extrabold text-6xl">{countdown}</span>
              <span className="text-amber-100 text-sm font-medium mt-2">Sending alert...</span>
            </div>
          ) : (
            <div className="w-52 h-52 rounded-full bg-gradient-to-br from-green-400 to-green-500 shadow-2xl shadow-green-300 flex flex-col items-center justify-center border-4 border-white">
              <Shield className="w-14 h-14 text-white mb-2" />
              <span className="text-white font-extrabold text-xl">Alert Sent!</span>
              <span className="text-green-100 text-xs font-medium mt-1">Help is on the way</span>
            </div>
          )}
        </div>

        {/* Status Cards */}
        {activated && countdown === 0 && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Location</p>
                <p className="text-[10px] text-gray-500">Shared</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                <MessageCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">SMS Sent</p>
                <p className="text-[10px] text-gray-500">To contacts</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center">
                <Siren className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Authorities</p>
                <p className="text-[10px] text-gray-500">Notified</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
                <Share2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-900">Live Track</p>
                <p className="text-[10px] text-gray-500">Active</p>
              </div>
            </div>
          </div>
        )}

        {/* Emergency Contacts */}
        <section>
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
            Emergency Contacts
          </h2>
          <div className="grid grid-cols-2 gap-2.5">
            {emergencyContacts.map((contact) => (
              <a
                key={contact.number}
                href={`tel:${contact.number}`}
                className="bg-white p-3.5 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center text-center gap-2 active:bg-gray-50 transition-colors"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${contact.color}`}>
                  <Phone className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-bold text-sm text-gray-900">{contact.name}</p>
                  <p className="text-[10px] text-gray-400 font-medium">{contact.desc}</p>
                </div>
                <span className="text-xs font-extrabold text-red-500 bg-red-50 px-3 py-1 rounded-lg">{contact.number}</span>
              </a>
            ))}
          </div>
        </section>
      </div>

      <BottomNav />
    </div>
  );
}
