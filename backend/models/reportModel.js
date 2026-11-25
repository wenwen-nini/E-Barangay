
const pool = require("../config/database.js");

// Reusable date-range condition
function buildDateFilter(dateFrom, dateTo, tableAlias = "r") {
    let conditions = [];
    let params = [];

    if (dateFrom) {
        conditions.push(`${tableAlias}.request_date >= ?`);
        params.push(dateFrom);
    }

    if (dateTo) {
        conditions.push(
            `${tableAlias}.request_date < DATE_ADD(?, INTERVAL 1 DAY)`
        );
        params.push(dateTo);
    }

    return {
        condition: conditions.length
            ? `AND ${conditions.join(" AND ")}`
            : "",
        params
    };
}

// 1. KPI Summary
async function getReportSummary(dateFrom, dateTo) {
    const { condition, params } = buildDateFilter(dateFrom, dateTo);

    const [rows] = await pool.execute(
        `SELECT
            COUNT(*) AS total_requests,

            COALESCE(SUM(
                status IN ('Pending', 'Under Review')
            ), 0) AS in_progress,

            COALESCE(SUM(
                status = 'Approved'
            ), 0) AS ready_for_pickup,

            COALESCE(SUM(
                status = 'Rejected'
            ), 0) AS rejected,

            COALESCE(SUM(
                status IN ('Approved', 'Rejected', 'Released')
            ), 0) AS processed_requests

        FROM \`Request\` r
        WHERE 1 = 1
        ${condition}`,
        params
    );

    const summary = rows[0];

    const totalRejected = Number(summary.rejected);
    const totalProcessed = Number(summary.processed_requests);

    return {
        total_requests: Number(summary.total_requests),
        in_progress: Number(summary.in_progress),
        ready_for_pickup: Number(summary.ready_for_pickup),
        rejected: totalRejected,
        processed_requests: totalProcessed,
        reject_rate: totalProcessed > 0
            ? Number(((totalRejected / totalProcessed) * 100).toFixed(2))
            : 0
    };
}

// 2. Monthly Request Trend
async function getMonthlyRequestTrend(dateFrom, dateTo) {
    const { condition, params } = buildDateFilter(dateFrom, dateTo);

    const [rows] = await pool.execute(
        `SELECT
            DATE_FORMAT(r.request_date, '%Y-%m') AS month_key,
            DATE_FORMAT(r.request_date, '%b %Y') AS month_label,
            COUNT(*) AS total_requests

        FROM \`Request\` r
        WHERE 1 = 1
        ${condition}

        GROUP BY
            DATE_FORMAT(r.request_date, '%Y-%m'),
            DATE_FORMAT(r.request_date, '%b %Y')

        ORDER BY
            DATE_FORMAT(r.request_date, '%Y-%m')`,
        params
    );

    return rows;
}


// 3. Request Status Breakdown
async function getRequestStatusBreakdown(dateFrom, dateTo) {
    const { condition, params } = buildDateFilter(dateFrom, dateTo);

    const [rows] = await pool.execute(
        `SELECT
            r.status,
            COUNT(*) AS total_requests

        FROM \`Request\` r
        WHERE 1 = 1
        ${condition}

        GROUP BY r.status
        ORDER BY r.status`,
        params
    );

    return rows;
}

// 4. Document Demand
async function getDocumentDemand(dateFrom, dateTo) {
    const { condition, params } = buildDateFilter(dateFrom, dateTo);

    const [rows] = await pool.execute(
        `SELECT
            d.document_id,
            d.document_name,
            COUNT(r.request_id) AS total_requests

        FROM \`Request\` r

        INNER JOIN Document d
            ON d.document_id = r.document_id

        WHERE 1 = 1
        ${condition}

        GROUP BY
            d.document_id,
            d.document_name

        ORDER BY total_requests DESC`,
        params
    );

    return rows;
}

// 5. Reject Rate by Document
async function getRejectRateByDocument(dateFrom, dateTo) {
    const { condition, params } = buildDateFilter(dateFrom, dateTo);

    const [rows] = await pool.execute(
        `SELECT
            d.document_id,
            d.document_name,

            SUM(r.status = 'Rejected') AS rejected_requests,

            SUM(
                r.status IN ('Approved', 'Rejected', 'Released')
            ) AS processed_requests,

            CASE
                WHEN SUM(
                    r.status IN ('Approved', 'Rejected', 'Released')
                ) > 0
                THEN ROUND(
                    SUM(r.status = 'Rejected') /
                    SUM(r.status IN ('Approved', 'Rejected', 'Released'))
                    * 100,
                    2
                )
                ELSE 0
            END AS reject_rate

        FROM \`Request\` r

        INNER JOIN Document d
            ON d.document_id = r.document_id

        WHERE 1 = 1
        ${condition}

        GROUP BY
            d.document_id,
            d.document_name

        ORDER BY reject_rate DESC`,
        params
    );

    return rows;
}

// 6. Requests by Day of the Week
async function getRequestsByWeekday(dateFrom, dateTo) {
    const { condition, params } = buildDateFilter(dateFrom, dateTo);

    const [rows] = await pool.execute(
        `SELECT
            DAYNAME(r.request_date) AS day_name,
            DAYOFWEEK(r.request_date) AS day_number,
            COUNT(*) AS total_requests

        FROM \`Request\` r

        WHERE 1 = 1
        ${condition}

        GROUP BY
            DAYOFWEEK(r.request_date),
            DAYNAME(r.request_date)

        ORDER BY
            CASE day_number
                WHEN 2 THEN 1
                WHEN 3 THEN 2
                WHEN 4 THEN 3
                WHEN 5 THEN 4
                WHEN 6 THEN 5
                WHEN 7 THEN 6
                WHEN 1 THEN 7
            END`,
        params
    );

    return rows;
}

module.exports = {
    getReportSummary,
    getMonthlyRequestTrend,
    getRequestStatusBreakdown,
    getDocumentDemand,
    getRejectRateByDocument,
    getRequestsByWeekday
};
