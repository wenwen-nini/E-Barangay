
const reportModel = require("../models/reportModel");

// Retrieve all report data
async function getReports(req, res) {
    try {
        const { dateFrom = "", dateTo = "" } = req.query;

        // Validate date format (YYYY-MM-DD)
        const datePattern = /^\d{4}-\d{2}-\d{2}$/;

        if (
            (dateFrom && !datePattern.test(dateFrom)) ||
            (dateTo && !datePattern.test(dateTo))
        ) {
            return res.status(400).json({
                success: false,
                message: "Invalid date format. Use YYYY-MM-DD."
            });
        }

        // Validate that the start date is not later than the end date
        if (dateFrom && dateTo && dateFrom > dateTo) {
            return res.status(400).json({
                success: false,
                message: "The start date cannot be later than the end date."
            });
        }

        const [
            summary,
            monthlyTrend,
            statusBreakdown,
            documentDemand,
            rejectRateByDocument,
            weekdayRequests
        ] = await Promise.all([
            reportModel.getReportSummary(dateFrom, dateTo),
            reportModel.getMonthlyRequestTrend(dateFrom, dateTo),
            reportModel.getRequestStatusBreakdown(dateFrom, dateTo),
            reportModel.getDocumentDemand(dateFrom, dateTo),
            reportModel.getRejectRateByDocument(dateFrom, dateTo),
            reportModel.getRequestsByWeekday(dateFrom, dateTo)
        ]);

        return res.status(200).json({
            success: true,
            data: {
                summary,
                monthlyTrend,
                statusBreakdown,
                documentDemand,
                rejectRateByDocument,
                weekdayRequests
            }
        });

    } catch (error) {
        console.error("Get reports error:", error);

        return res.status(500).json({
            success: false,
            message: "Failed to retrieve report data."
        });
    }
}

module.exports = {
    getReports
};
