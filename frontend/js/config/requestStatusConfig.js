export const requestStatusConfig = {
    Pending: {
        label: "Pending",
        cssClass: "pending",
        actions: ["Follow-up", "Cancel-Request"]
    },

    "Under Review": {
        label: "Under Review",
        cssClass: "under-review",
        actions: []
    },

    Approved: {
        label: "Approved",
        cssClass: "approved",
        actions: []
    },

    Rejected: {
        label: "Rejected",
        cssClass: "rejected",
        actions: []
    },

    Returned: {
        label: "Returned",
        cssClass: "returned",
        actions: ["Submit missing documents"],
    },

    Released: {
        label: "Released",
        cssClass: "released",
        actions: []
    },

    Cancelled: {
        label: "Cancelled",
        cssClass: "cancelled",
        actions: []
    }
};