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
            <label class="modal-label" for="missing-document">
                Valid ID - Missing requirement
            </label>

            <input
                type="file"
                id="missing-document"
                name="document"
                accept=".jpg,.jpeg,.png,.pdf"
                required>
            
            <small>
                JPG, PNG or PDF. Maximum file size: 5 MB.
            </small>

            <label for="replacement-note">
                Reply to staff - Optional
            </label>

            <textarea
                id="replacement-note"
                name="reply"
                placeholder="Add a short note about your replacement file">
            </textarea>
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