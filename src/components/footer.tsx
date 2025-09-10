import { Mail, Phone, MapPin, Heart, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Logo + About */}
          <div className="lg:col-span-2">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">BB</span>
              </div>
              <span className="text-2xl font-bold text-white">
                Borrow Base
              </span>
            </div>
            <p className="text-gray-300 mb-6 text-sm leading-relaxed">
              Building sustainable communities through resource sharing and
              neighbor connections. Share what you have, borrow what you need.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 cursor-pointer group"
                title="Follow us on Twitter"
              >
                <Twitter size={16} className="text-gray-300 group-hover:text-white" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 cursor-pointer group"
                title="Connect on LinkedIn"
              >
                <Linkedin size={16} className="text-gray-300 group-hover:text-white" />
              </a>
              <a 
                href="#" 
                className="w-9 h-9 bg-gray-700 rounded-lg flex items-center justify-center hover:bg-blue-600 transition-colors duration-200 cursor-pointer group"
                title="View on GitHub"
              >
                <Github size={16} className="text-gray-300 group-hover:text-white" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">Quick Links</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="/home" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">
                  Browse Resources
                </a>
              </li>
              <li>
                <a href="/profile" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">
                  My Profile
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#" className="text-gray-300 hover:text-white transition-colors duration-200 cursor-pointer">
                  Community Guidelines
                </a>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">Get in Touch</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center space-x-3 text-gray-300">
                <Mail size={16} className="text-blue-400" /> 
                <a href="mailto:hello@borrowbase.com" className="hover:text-white transition-colors duration-200 cursor-pointer">
                  hello@borrowbase.com
                </a>
              </li>
              <li className="flex items-center space-x-3 text-gray-300">
                <Phone size={16} className="text-green-400" /> 
                <a href="tel:1-800-BORROWBASE" className="hover:text-white transition-colors duration-200 cursor-pointer">
                  1-800-BORROWBASE
                </a>
              </li>
              <li className="flex items-center space-x-3 text-gray-300">
                <MapPin size={16} className="text-red-400" /> 
                <span>Serving communities nationwide</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t border-gray-700 py-6">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center space-x-2 text-sm text-gray-400 mb-4 md:mb-0">
            <span>© 2024 Borrow Base. Made with</span>
            <Heart size={14} className="text-red-500" />
            <span>for sustainable communities</span>
          </div>
          <div className="flex space-x-6 text-sm">
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
              Privacy Policy
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
              Terms of Service
            </a>
            <a href="#" className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
              Cookie Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
