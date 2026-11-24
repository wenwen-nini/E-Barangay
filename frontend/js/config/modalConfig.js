export const modalConfig = {
    "Follow-up": {
        title: "Follow up on your request",
        description: "Ask the barangay staff about an existing request.",
        submitLabel: "Send follow-up",

        content: `
            <label class="modal-label" for="follow-up-message">Message *</label>

            <textarea
                id="follow-up-message"
                name="message"
                placeholder="Enter your follow-up message..."
                required>
            </textarea>

            <small>
                Previous request details will be attached automatically.
                Avoid sending passwords or unrelated personal information.
            </small>
        `
    },
    "Submit Missing Documents": {
        title: "Submit missing documents",
        description: "Send the required file so staff can review your request again.",
        submitLabel: "Resubmit for review",

        content: `
            <div id="missing-requirements-container">
                <p>Loading requirements...</p>
            </div>

            <label for="replacement-note">
                Reply to Staff - Optional
            </label>

            <textarea
                id="replacement-note"
                name="reply"
                placeholder="Add a short note about your replacement files">
            </textarea>

            <small>
                JPG, PNG, and PDF. Maximul file size: 5MB per file.
            </small>
        `
    },
    "Cancel Request": {
        title: "Cancel this pending request?",
        description: "Please confirm before stopping this request.",
        submitLabel: "Cancel Request",

        content: `
            <label class="modal-label" for="cancellation-reason">
                Reason for cancellation - Optional
            </label>

            <textarea
                id="cancellation-reason"
                name="reason"
                placeholder="Tell us why you no longer need this request">
            </textarea>

            <small>
                Once cancelled, you will need to submit a new request
                if you need this document later.
            </small>
        `
    }
};