import BorrowRequests from "../Component/borrowRequests";

const Notification = () => {
  return (
    <div className="p-4">
      <h2 className="text-2xl font-semibold text-white mb-4">Notifications</h2>

      {/* Borrow requests go here */}
      <BorrowRequests />

      {/* Other notifications (if you have any) can follow */}
    </div>
  );
};

export default Notification;
