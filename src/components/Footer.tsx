import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Scale } from 'lucide-react';
export const Footer = () => {
  return <footer className="mt-12 pt-8 border-t border-slate-700 bg-gradient-to-r from-slate-900/50 to-slate-800/50 bg-blue-950">
      <div className="container px-4 mx-0 my-[7px] py-0">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* App Info */}
          <div className="text-center md:text-left">
            <h3 className="text-lg font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Perfect Audio v2.0
            </h3>
            <p className="text-slate-400 text-sm">Professional browser-based audio enhancement</p>
          </div>

          {/* Legal Links */}
          <div className="flex items-center space-x-6">
            <Link to="/terms" className="flex items-center gap-2 text-slate-300 hover:text-blue-400 transition-colors duration-200 text-sm">
              <Scale className="h-4 w-4" />
              Terms & Conditions
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>

          {/* Copyright */}
          <div className="text-center md:text-right">
            <p className="text-slate-500 text-xs">
              © 2024 Perfect Audio. All rights reserved.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              Browser-native processing • No server uploads
            </p>
          </div>
        </div>

        {/* Additional Legal Notice */}
        <div className="mt-4 pt-4 border-t border-slate-800 mx-0 px-[8px] py-[11px]">
          <p className="text-center text-xs leading-relaxed text-zinc-50">
            Users retain all rights to their audio content. Perfect Audio does not claim ownership of uploaded or processed files.
          </p>
        </div>
      </div>
    </footer>;
};