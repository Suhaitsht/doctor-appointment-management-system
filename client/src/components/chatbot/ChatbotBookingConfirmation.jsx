import { useState } from "react";
import { confirmChatbotBooking } from "../../services/chatbotBookingApi";

export default function ChatbotBookingConfirmation({
  summary,
  patientDetails,
  token,
  onPaymentReady,
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [createdAppointmentId, setCreatedAppointmentId] = useState(null);

  const handleConfirm = async () => {
    if (loading || createdAppointmentId) return;

    setLoading(true);
    setError("");

    try {
      const result = await confirmChatbotBooking({
        summary,
        patientDetails,
        token,
      });

      setCreatedAppointmentId(result.appointmentId);

      // The parent must open PayHere using the
      // existing working checkout implementation.
      if (onPaymentReady) {
        onPaymentReady(result);
      }
    } catch (err) {
      if (err.appointmentId) {
        setCreatedAppointmentId(err.appointmentId);
        setError(
          `Appointment ${err.appointmentId} was created, but payment ` +
            `could not start. Use the existing payment retry flow. ` +
            err.message,
        );
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!summary) return null;

  return (
    <div className="max-w-md rounded-2xl border bg-white p-5 shadow-sm">
      <h3 className="mb-4 text-lg font-bold">Appointment Summary</h3>

      <div className="space-y-2 text-sm">
        <p>
          <strong>Doctor:</strong> {summary.doctorName}
        </p>

        <p>
          <strong>Speciality:</strong> {summary.speciality}
        </p>

        <p>
          <strong>Date:</strong> {summary.appointmentDate}
        </p>

        <p>
          <strong>Time:</strong> {summary.startTime} - {summary.endTime}
        </p>

        <p>
          <strong>Consultation Fee:</strong> LKR {summary.consultationFee}
        </p>
      </div>

      <p className="mt-4 text-xs text-gray-500">
        Your appointment will be pending until payment is verified. The final
        amount is calculated by the server.
      </p>

      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={loading || Boolean(createdAppointmentId)}
        onClick={handleConfirm}
        className="mt-5 w-full rounded-xl bg-blue-600 px-4 py-3
                   font-semibold text-white disabled:opacity-50"
      >
        {loading
          ? "Processing..."
          : createdAppointmentId
            ? "Appointment Created"
            : "Confirm & Continue to Payment"}
      </button>
    </div>
  );
}
