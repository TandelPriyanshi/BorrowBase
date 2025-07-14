const Footer = () => {
  return (
    <footer className="text-black py-4 mt-auto border-t border-gray-300">
      <div className="container mx-auto text-center">
        <p>&copy; {new Date().getFullYear()} Your Company Name. All rights reserved.</p>
        <p>Follow us on 
          <a href="https://twitter.com" className="text-blue-400 hover:underline"> Twitter</a>, 
          <a href="https://facebook.com" className="text-blue-400 hover:underline"> Facebook</a>, and 
          <a href="https://instagram.com" className="text-blue-400 hover:underline"> Instagram</a>.
        </p>
      </div>
    </footer>
  );
}

export default Footer;