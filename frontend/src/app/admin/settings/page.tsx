"use client";

import { Settings, Bell, Shield, Database, Globe } from "lucide-react";

const settingsSections = [
  {
    icon: Bell,
    title: "Notifications",
    description: "Configure system-wide notification preferences and alert thresholds.",
    color: "bg-blue-50 text-blue-600",
  },
  {
    icon: Shield,
    title: "Security",
    description: "Manage authentication policies, session timeouts, and access control.",
    color: "bg-green-50 text-green-600",
  },
  {
    icon: Database,
    title: "Data Management",
    description: "Configure database retention policies, backup schedules, and archiving rules.",
    color: "bg-purple-50 text-purple-600",
  },
  {
    icon: Globe,
    title: "Platform Settings",
    description: "Set global auction rules, bid increment defaults, and platform currency.",
    color: "bg-orange-50 text-orange-600",
  },
];

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Settings className="w-8 h-8 text-slate-600" />
          Platform Settings
        </h1>
        <p className="text-gray-500">Manage global platform configuration and preferences</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {settingsSections.map((section) => {
          const Icon = section.icon;
          return (
            <div
              key={section.title}
              className="bg-white rounded-xl border shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow cursor-pointer"
            >
              <div className={`p-3 rounded-xl ${section.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{section.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{section.description}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
        <p className="text-amber-800 font-medium">⚠️ Settings configuration coming soon</p>
        <p className="text-amber-700 text-sm mt-1">
          Advanced platform settings are under development. Core auction and user management is fully operational.
        </p>
      </div>
    </div>
  );
}
