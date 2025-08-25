import { Mail, Phone, MapPin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white border-t">
      <div className="max-w-7xl mx-auto px-70 py-10 grid grid-cols-1 md:grid-cols-2 gap-10">
        
        {/* Logo + About */}
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-xl font-semibold text-gray-800">
              BorrowBase
            </span>
          </div>
          <p className="mt-3 text-gray-600 text-sm">
            Building sustainable communities through resource sharing and
            neighbor connections.
          </p>
        </div>

        {/* Contact */}
        <div>
          <h4 className="font-semibold text-gray-800 mb-3">Get in Touch</h4>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <Mail size={16} /> <span>hello@borrowbase.com</span>
            </li>
            <li className="flex items-center space-x-2">
              <Phone size={16} /> <span>1-800-BORROWBASE</span>
            </li>
            <li className="flex items-center space-x-2">
              <MapPin size={16} /> <span>Serving communities nationwide</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom bar */}
      <div className="border-t py-4 text-center text-sm text-gray-500">
        © 2024 BorrowBase. All rights reserved.
        <div className="mt-2 space-x-4">
          <a href="#">Privacy</a>
          <a href="#">Terms</a>
          <a href="#">Cookies</a>
        </div>
      </div>
    </footer>
  );
}
