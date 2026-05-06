// AppointmentScheduler.jsx
import React, { useState, useEffect, useCallback } from "react";
import "./style/AppointmentScheduler.css";
import AxiosInstance from "./AxiosInstance";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_green.css";

export default function AppointmentScheduler({ role = "client" }) {
  const [appointments, setAppointments] = useState([]);
  const [myAppointment, setMyAppointment] = useState(null);
  const [waitlistEntries, setWaitlistEntries] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedService, setSelectedService] = useState("");
  const [description, setDescription] = useState("");
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [pencilReservations, setPencilReservations] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [bookingData, setBookingData] = useState(null);
  const [step, setStep] = useState(1); // 1: Calendar, 2: Service, 3: Time, 4: Confirmation

  const CLINIC_OPEN = 9;
  const CLINIC_CLOSE = 18;
  const LUNCH_START = 12;
  const LUNCH_END = 13;
  const TOTAL_SLOTS_PER_DAY = 10;

  const SERVICES = [
    { id: "teeth_cleaning", name: "Teeth Cleaning", duration: 60, price: "₱1,000", icon: "fa-tooth" },
    { id: "tooth_extraction", name: "Tooth Extraction", duration: 60, price: "₱1,000", icon: "fa-teeth" },
    { id: "dental_filling", name: "Dental Filling", duration: 60, price: "₱1,000", icon: "fa-fill-drip" },
    { id: "orthodontic", name: "Braces/Orthodontic", duration: 120, price: "₱50,000", icon: "fa-smile" }
  ];

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = useCallback(async () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const [appointmentsRes, myAppointmentsRes, waitlistRes, notificationsRes] = await Promise.all([
        AxiosInstance.get("appointments/"),
        AxiosInstance.get("appointments/", { params: { user_id: user?.id } }),
        AxiosInstance.get("appointments/waitlist_status/"),
        AxiosInstance.get("notifications/")
      ]);
      
      setAppointments(Array.isArray(appointmentsRes.data) ? appointmentsRes.data : []);
      const myApps = Array.isArray(myAppointmentsRes.data) ? myAppointmentsRes.data : [];
      const activeApp = myApps.find(a => a && !["completed", "cancelled"].includes(a.status));
      setMyAppointment(activeApp || null);
      
      const waitlistData = waitlistRes.data?.waitlists || waitlistRes.data?.waitlist_entries || [];
      setWaitlistEntries(waitlistData);
      setNotifications(Array.isArray(notificationsRes.data?.notifications) ? notificationsRes.data.notifications : []);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  useEffect(() => {
    if (selectedDate && step === 3) {
      fetchAvailableSlots();
    }
  }, [selectedDate, selectedService, step]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;
    setLoading(true);
    try {
      const dateStr = selectedDate;
      const serviceId = SERVICES.find(s => s.name === selectedService)?.id || "consultation";
      const { data } = await AxiosInstance.get("appointments/get_available_slots/", {
        params: { date: dateStr, service: serviceId }
      });
      
      const slots = generateTimeSlots().map(slot => {
        const isBooked = data.available_slots && !data.available_slots.includes(slot.time);
        const isPenciled = pencilReservations[`${dateStr}_${slot.time}`];
        return {
          ...slot,
          isBooked: isBooked && !isPenciled,
          isPenciled: isPenciled === true,
          isMyPencil: isPenciled === "mine"
        };
      });
      setAvailableSlots(slots);
    } catch (error) {
      console.error("Error fetching slots:", error);
      setAvailableSlots(generateTimeSlots().map(slot => ({ ...slot, isBooked: false, isPenciled: false })));
    } finally {
      setLoading(false);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = CLINIC_OPEN; hour < CLINIC_CLOSE; hour++) {
      if (hour === LUNCH_START) continue;
      const ampm = hour >= 12 ? "PM" : "AM";
      const displayHour = hour > 12 ? hour - 12 : hour === 0 ? 12 : hour;
      slots.push({
        time: `${displayHour}:00 ${ampm}`,
        timeValue: `${hour.toString().padStart(2, '0')}:00:00`,
        duration: 60
      });
      slots.push({
        time: `${displayHour}:30 ${ampm}`,
        timeValue: `${hour.toString().padStart(2, '0')}:30:00`,
        duration: 60
      });
    }
    return slots;
  };

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setStep(2);
    showToast("Date selected! Now choose a service.", "info");
  };

  const handleServiceSelect = (service) => {
    setSelectedService(service);
    setStep(3);
    showToast("Service selected! Now pick a time slot.", "info");
  };

  const handleBackToDate = () => {
    setStep(1);
    setSelectedService("");
    setSelectedSlot(null);
  };

  const handleBackToService = () => {
    setStep(2);
    setSelectedSlot(null);
  };

  const handleBackToTime = () => {
    setStep(3);
    setShowConfirmation(false);
    setBookingData(null);
  };

  const handleSlotSelect = (slot) => {
    setSelectedSlot(slot);
    setShowConfirmation(true);
    setStep(4);
    setBookingData({
      date: selectedDate,
      service: selectedService,
      time: slot.time,
      timeValue: slot.timeValue,
      description: description,
      price: SERVICES.find(s => s.name === selectedService)?.price || "Price upon consultation"
    });
  };

  const handlePencilReservation = (slot) => {
    if (!selectedDate) {
      showToast("Please select a date first", "warning");
      return;
    }
    if (!selectedService) {
      showToast("Please select a service first", "warning");
      return;
    }
    if (slot.isBooked) {
      showToast("This slot is already booked", "warning");
      return;
    }
    
    const key = `${selectedDate}_${slot.time}`;
    setPencilReservations(prev => ({
      ...prev,
      [key]: "mine"
    }));
    showToast(`✏️ Pencil reserved for ${slot.time} (expires in 8 hours)`, "info");
    
    setTimeout(() => {
      setPencilReservations(prev => {
        if (prev[key] === "mine") {
          const newPrev = { ...prev };
          delete newPrev[key];
          showToast(`Pencil reservation for ${slot.time} has expired`, "warning");
          return newPrev;
        }
        return prev;
      });
    }, 8 * 60 * 60 * 1000);
  };

  const handleConfirmBooking = async () => {
    if (myAppointment) {
      showToast("You already have an active appointment. Please cancel it first.", "warning");
      return;
    }
    
    setLoading(true);
    try {
      const requestData = {
        date: bookingData.date,
        time: bookingData.timeValue,
        service: SERVICES.find(s => s.name === bookingData.service)?.id || null,
        other_concern: bookingData.service === "Other" ? description : bookingData.service,
        description: description
      };
      
      await AxiosInstance.post("appointments/", requestData);
      showToast("Appointment booked successfully!", "success");
      
      // Reset all states
      setSelectedService("");
      setDescription("");
      setSelectedDate(null);
      setSelectedSlot(null);
      setShowConfirmation(false);
      setBookingData(null);
      setStep(1);
      await fetchData();
      
      const key = `${selectedDate}_${bookingData.time}`;
      setPencilReservations(prev => {
        const newPrev = { ...prev };
        delete newPrev[key];
        return newPrev;
      });
    } catch (error) {
      console.error("Booking error:", error);
      showToast(error.response?.data?.error || "Error booking appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelAppointment = async () => {
    if (!myAppointment) return;
    setLoading(true);
    try {
      await AxiosInstance.delete(`appointments/${myAppointment.id}/`);
      showToast("Appointment cancelled successfully", "success");
      await fetchData();
    } catch (error) {
      console.error("Cancel error:", error);
      showToast("Error cancelling appointment", "error");
    } finally {
      setLoading(false);
    }
  };

  const joinWaitlist = async () => {
    if (!selectedDate) {
      showToast("Please select a date first", "warning");
      return;
    }
    if (!selectedService) {
      showToast("Please select a service first", "warning");
      return;
    }
    
    setLoading(true);
    try {
      const requestData = {
        preferred_date: selectedDate,
        time_start: "09:00",
        time_end: "17:00",
        service: selectedService,
        description: description,
        urgency_level: 2
      };
      
      await AxiosInstance.post("appointments/join_waitlist/", requestData);
      showToast("Added to waitlist successfully!", "success");
      await fetchData();
    } catch (error) {
      console.error("Waitlist error:", error);
      showToast(error.response?.data?.error || "Error joining waitlist", "error");
    } finally {
      setLoading(false);
    }
  };

  const cancelWaitlist = async (entryId) => {
    setLoading(true);
    try {
      await AxiosInstance.delete(`appointments/waitlist/${entryId}/`);
      showToast("Removed from waitlist", "success");
      await fetchData();
    } catch (error) {
      console.error("Cancel waitlist error:", error);
      showToast("Error removing from waitlist", "error");
    } finally {
      setLoading(false);
    }
  };

  const getProcedurePrice = (serviceName) => {
    const service = SERVICES.find(s => s.name === serviceName);
    return service?.price || "Price upon consultation";
  };

  const getStatusColor = (status) => {
    const colors = { confirmed: '#4caf50', pending: '#ff9800', cancelled: '#f44336', completed: '#9e9e9e' };
    return colors[status] || '#757575';
  };

  const getStatusLabel = (status) => {
    const labels = { pending: 'Pending', confirmed: 'Confirmed', completed: 'Completed', cancelled: 'Cancelled' };
    return labels[status] || status;
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <div className="step-indicator">
      <div className={`step ${step >= 1 ? 'active' : ''}`}>
        <div className="step-number">1</div>
        <div className="step-label">Select Date</div>
      </div>
      <div className={`step-line ${step >= 2 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 2 ? 'active' : ''}`}>
        <div className="step-number">2</div>
        <div className="step-label">Choose Service</div>
      </div>
      <div className={`step-line ${step >= 3 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 3 ? 'active' : ''}`}>
        <div className="step-number">3</div>
        <div className="step-label">Pick Time</div>
      </div>
      <div className={`step-line ${step >= 4 ? 'active' : ''}`}></div>
      <div className={`step ${step >= 4 ? 'active' : ''}`}>
        <div className="step-number">4</div>
        <div className="step-label">Confirmation</div>
      </div>
    </div>
  );

  // Render Calendar Step
  const renderCalendarStep = () => (
    <div className="step-content">
      <div className="calendar-wrapper">
        <Flatpickr
          value={selectedDate || new Date()}
          onChange={(dates) => dates[0] && handleDateSelect(dates[0].toISOString().split('T')[0])}
          options={{
            inline: true,
            dateFormat: "Y-m-d",
            minDate: "today",
            disable: [
              function(date) {
                return date.getDay() === 0;
              }
            ],
            locale: {
              firstDayOfWeek: 1
            }
          }}
        />
        <div className="selected-date-badge">
          <i className="fas fa-calendar-day"></i> 
          {selectedDate ? `Selected: ${selectedDate}` : " Pick a date above to continue"}
        </div>
      </div>
    </div>
  );

  // Render Service Selection Step
  const renderServiceStep = () => (
    <div className="step-content">
      <button onClick={handleBackToDate} className="back-btn">
        <i className="fas fa-arrow-left"></i> Back to Date
      </button>
      
      <div className="services-grid">
        {SERVICES.map(service => (
          <div key={service.id} className="service-card" onClick={() => handleServiceSelect(service.name)}>
            <i className={`fas ${service.icon}`}></i>
            <h3>{service.name}</h3>
            <p className="service-duration">{service.duration} minutes</p>
            <p className="service-price">{service.price}</p>
          </div>
        ))}
        <div className="service-card other-service" onClick={() => handleServiceSelect("Other")}>
          <i className="fas fa-comment-medical"></i>
          <h3>Other Concern</h3>
          <p className="service-duration">Consultation</p>
          <p className="service-price">Price upon consultation</p>
        </div>
      </div>

      {(selectedService === "Other" || description) && (
        <div className="form-row">
          <label><i className="fas fa-comment-medical"></i> Additional Concerns / Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Please describe your symptoms, concerns, or any additional information you'd like to share with the dentist..."
            rows="3"
          ></textarea>
        </div>
      )}
    </div>
  );

  // Render Time Slots Step
  const renderTimeSlotStep = () => (
    <div className="step-content">
      <button onClick={handleBackToService} className="back-btn">
        <i className="fas fa-arrow-left"></i> Back to Services
      </button>
      
      <div className="selected-info">
        <p><strong>Selected Date:</strong> {selectedDate}</p>
        <p><strong>Selected Service:</strong> {selectedService}</p>
        {description && <p><strong>Notes:</strong> {description.substring(0, 50)}</p>}
      </div>

      <div style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span className="text-muted"><i className="fas fa-info-circle"></i> Available time slots</span>
        <button onClick={fetchAvailableSlots} className="btn-small btn-outline">
          <i className="fas fa-sync-alt"></i> Refresh
        </button>
      </div>

      <div className="schedule-grid">
        {loading ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
            <i className="fas fa-spinner fa-pulse"></i> Loading slots...
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-muted" style={{ textAlign: 'center', padding: '20px' }}>
            No slots available for this date
            <button onClick={joinWaitlist} className="btn-small" style={{ marginLeft: '10px' }}>
              Join Waitlist
            </button>
          </div>
        ) : (
          availableSlots.map((slot, idx) => (
            <div key={idx} className="slot-item">
              <div>
                <div className="slot-time"><i className="far fa-clock"></i> {slot.time}</div>
                <div className={`slot-status ${slot.isBooked ? 'status-booked' : slot.isMyPencil ? 'status-available' : slot.isPenciled ? 'status-booked' : 'status-available'}`}>
                  {slot.isBooked ? "Booked" : slot.isMyPencil ? "Your pencil (8h reserve)" : slot.isPenciled ? "Pencil-held" : "Available"}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {!slot.isBooked && !slot.isPenciled && (
                  <>
                    <button 
                      className="btn-small btn-outline" 
                      onClick={() => handlePencilReservation(slot)}
                    >
                      <i className="fas fa-pencil-alt"></i> Pencil
                    </button>
                    <button 
                      className="btn-small" 
                      onClick={() => handleSlotSelect(slot)}
                      disabled={!selectedService}
                    >
                      <i className="fas fa-calendar-plus"></i> Select
                    </button>
                  </>
                )}
                {slot.isMyPencil && (
                  <>
                    <button 
                      className="btn-small" 
                      onClick={() => handleSlotSelect(slot)}
                    >
                      <i className="fas fa-check-circle"></i> Confirm & Select
                    </button>
                    <button 
                      className="btn-small btn-outline" 
                      onClick={() => {
                        const key = `${selectedDate}_${slot.time}`;
                        setPencilReservations(prev => {
                          const newPrev = { ...prev };
                          delete newPrev[key];
                          return newPrev;
                        });
                        showToast(`Released pencil for ${slot.time}`, "info");
                      }}
                    >
                      <i className="fas fa-trash-alt"></i> Release
                    </button>
                  </>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      <div className="notify-box">
        <i className="fas fa-hourglass-half"></i> <strong>Pencil booking:</strong> Temporarily reserve a slot (expires after 8 hours)
      </div>
    </div>
  );

  // Render Confirmation Step
  const renderConfirmationStep = () => (
    <div className="step-content">
      <button onClick={handleBackToTime} className="back-btn">
        <i className="fas fa-arrow-left"></i> Back to Time Slots
      </button>
      
      <div className="confirmation-card">
        <h3><i className="fas fa-clipboard-list"></i> Review Your Appointment</h3>
        
        <div className="confirmation-details">
          <div className="detail-row">
            <span className="detail-label"><i className="fas fa-calendar-day"></i> Date:</span>
            <span className="detail-value">{bookingData?.date}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label"><i className="fas fa-clock"></i> Time:</span>
            <span className="detail-value">{bookingData?.time}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label"><i className="fas fa-stethoscope"></i> Service:</span>
            <span className="detail-value">{bookingData?.service}</span>
          </div>
          <div className="detail-row">
            <span className="detail-label"><i className="fas fa-tag"></i> Price:</span>
            <span className="detail-value price">{bookingData?.price}</span>
          </div>
          {description && (
            <div className="detail-row">
              <span className="detail-label"><i className="fas fa-comment"></i> Notes:</span>
              <span className="detail-value">{description}</span>
            </div>
          )}
        </div>
        
        <div className="notify-box" style={{ marginTop: '20px' }}>
          <i className="fas fa-info-circle"></i> Your appointment request will be sent to admin for confirmation. 
          You'll receive a notification once confirmed.
        </div>
        
        <button 
          className="confirm-btn" 
          onClick={handleConfirmBooking} 
          disabled={loading || myAppointment}
        >
          {loading ? "Processing..." : "Confirm & Book Appointment"}
        </button>
        
        {myAppointment && (
          <p className="warning-text">
            <i className="fas fa-exclamation-triangle"></i> You already have an active appointment. Please cancel it first.
          </p>
        )}
      </div>
    </div>
  );

  return (
    <div className="appointment-scheduler">
      <div className="scheduler-bg-animation">
        <div className="scheduler-bg-circle scheduler-bg-circle-1"></div>
        <div className="scheduler-bg-circle scheduler-bg-circle-2"></div>
        <div className="scheduler-bg-circle scheduler-bg-circle-3"></div>
        <div className="scheduler-bg-circle scheduler-bg-circle-4"></div>
        <div className="scheduler-bg-circle scheduler-bg-circle-5"></div>
        <div className="scheduler-bg-circle scheduler-bg-circle-6"></div>
      </div>
      <div className="scheduler-particles" id="particles"></div>

      <div className="scheduler-container">
        <div className="scheduler-header">
          <h1><i className="fas fa-calendar-check"></i> Book Appointment Now</h1>
          <div className="scheduler-badge"><i className="fas fa-bell"></i> Real-time notifications active</div>
        </div>

        {renderStepIndicator()}

        <div className="scheduler-grid">
          {/* LEFT COLUMN - Booking Steps */}
          <div className="scheduler-card">
            <div className="scheduler-card-header">
              <h2>
                <i className="fas fa-calendar-alt"></i> 
                {step === 1 && "Step 1: Select Date"}
                {step === 2 && "Step 2: Choose Service"}
                {step === 3 && "Step 3: Pick Time Slot"}
                {step === 4 && "Step 4: Review & Confirm"}
              </h2>
            </div>
            <div className="scheduler-card-body">
              {step === 1 && renderCalendarStep()}
              {step === 2 && renderServiceStep()}
              {step === 3 && renderTimeSlotStep()}
              {step === 4 && renderConfirmationStep()}
            </div>
          </div>

          {/* RIGHT COLUMN - My Appointments & Waiting List */}
          <div className="scheduler-card">
            <div className="scheduler-card-header">
              <h2><i className="fas fa-user-md"></i> My Appointment & Waiting List</h2>
            </div>
            <div className="scheduler-card-body">
              <div id="activeAppointmentArea">
                {myAppointment ? (
                  <div className="appt-card">
                    <div className="flex-between">
                      <div>
                        <strong><i className="fas fa-calendar-day"></i> {myAppointment.date} · {myAppointment.formatted_time || myAppointment.time}</strong>
                        <br />
                        <span className="text-muted">
                          {myAppointment.service || myAppointment.other_concern} {getProcedurePrice(myAppointment.service || myAppointment.other_concern)}
                        </span>
                        <br />
                        <span 
                          className="status-badge"
                          style={{ backgroundColor: getStatusColor(myAppointment.status), color: 'white' }}
                        >
                          {getStatusLabel(myAppointment.status)}
                        </span>
                        {myAppointment.description && (
                          <div><small><i className="fas fa-comment"></i> {myAppointment.description}</small></div>
                        )}
                      </div>
                      <div>
                        {myAppointment.status === "pending" && (
                          <button onClick={cancelAppointment} className="btn-small danger-btn">
                            <i className="fas fa-ban"></i> Cancel
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-muted mt-3">
                      <i className="fas fa-clock"></i> 8-hour cancellation policy applies
                    </div>
                  </div>
                ) : (
                  <div className="appt-card">
                    <div className="flex-between">
                      <span><i className="fas fa-calendar-times"></i> No active appointment</span>
                      <span className="text-muted">Book a slot above</span>
                    </div>
                  </div>
                )}
              </div>

              <hr />

              <div className="flex-between">
                <strong><i className="fas fa-list-ul"></i> Waiting List</strong>
                <button onClick={joinWaitlist} className="btn-small btn-outline" disabled={!selectedDate || !selectedService}>
                  <i className="fas fa-plus-circle"></i> Join waiting list
                </button>
              </div>
              <div style={{ marginTop: '12px' }}>
                {waitlistEntries.length === 0 ? (
                  <div className="notify-box" style={{ marginTop: 0 }}>
                    <span className="text-muted"><i className="fas fa-hourglass"></i> Not on waiting list. Join to get notified when slots open.</span>
                  </div>
                ) : (
                  waitlistEntries.map(entry => (
                    <div key={entry.id} className="waiting-item">
                      <div className="waiting-info">
                        <strong><i className="fas fa-hourglass-half"></i> Waiting for {entry.preferred_date || entry.targetDate}</strong>
                        <div className="text-muted">{entry.service_needed || entry.service}</div>
                        {entry.description && <small><i className="fas fa-comment"></i> {entry.description.substring(0, 50)}</small>}
                        <div className="text-muted" style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                          Position: #{entry.position || '?'} in queue
                        </div>
                      </div>
                      <button onClick={() => cancelWaitlist(entry.id)} className="btn-small cancel-waiting-btn">
                        <i className="fas fa-times-circle"></i> Cancel
                      </button>
                    </div>
                  ))
                )}
              </div>

              <hr />

              <div>
                <strong><i className="fas fa-bell"></i> Live Notifications</strong>
                <div className="notification-panel">
                  {notifications.length === 0 ? (
                    <div className="text-muted">✅ Email confirmations & reminders will appear here</div>
                  ) : (
                    notifications.slice(0, 5).map(notif => (
                      <div key={notif.id} className="notification-item">
                        <i className={`fas ${notif.notification_type === 'appointment_confirmation' ? 'fa-check-circle' : notif.notification_type === 'appointment_reminder' ? 'fa-clock' : 'fa-bell'}`}></i>
                        <div>
                          <strong>{notif.title}</strong>
                          <div className="text-muted">{notif.message}</div>
                          <small>{new Date(notif.created_at).toLocaleString()}</small>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div className={`toast-msg toast-${toast.type}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}