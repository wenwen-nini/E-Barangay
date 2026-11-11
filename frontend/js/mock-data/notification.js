export const notifications = [
    {
        notification_id: 1,
        user_id: 1,
        request_id: 1,
        title: "Request Approved",
        message: "Your Barangay Clearance request has been approved. Please proceed to the barangay hall for release.",
        is_read: false,
        created_at: "2026-11-04"
    },
    {
        notification_id: 2,
        user_id: 1,
        request_id: 2,
        title: "Request Under Review",
        message: "Your Certificate of Indigency request is currently being reviewed.",
        is_read: false,
        created_at: "2026-11-06"
    },
    {
        notification_id: 3,
        user_id: 2,
        request_id: 3,
        title: "Action Required",
        message: "Please upload a clearer image of your identification.",
        is_read: true,
        created_at: "2026-11-03"
    },
    {
        notification_id: 4,
        user_id: 2,
        request_id: 4,
        title: "Document Ready for Pickup",
        message: "Your Barangay Clearance is ready for collection at the barangay hall.",
        is_read: true,
        created_at: "2026-10-27"
    },
    {
        notification_id: 5,
        user_id: 1,
        request_id: null,
        title: "New Barangay Announcement",
        message: "A new announcement about the barangay office schedule has been published.",
        is_read: false,
        created_at: "2026-11-01"
    }
];