
import { getReports } from "../../services/reportServices.js";

const dateFromInput = document.getElementById("date-from");
const dateToInput = document.getElementById("date-to");

const applyFilterBtn = document.getElementById("apply-filter-btn");
const resetFilterBtn = document.getElementById("reset-filter-btn");

const summaryContainer = document.querySelector(".report-summary-cards");

let reportData = null;
const chartColors = {
    navy: "#17365D",
    blue: "#4F78A6",
    gold: "#D4AF37",
    green: "#2F8C68",
    red: "#C9545D",
    slate: "#8A98A9",
    light: "#D6DEE8",
    grid: "#E5EBF2",
    text: "#52657A"
};

// Load report data
async function loadReports(dateFrom = "", dateTo = "") {
    try {
        summaryContainer.innerHTML = "<p>Loading report data...</p>";

        reportData = await getReports(dateFrom, dateTo);

        renderSummaryCards(reportData.summary, reportData.statusBreakdown);
        renderMonthlyTrend(reportData.monthlyTrend);
        renderStatusBreakdown(reportData.statusBreakdown);
        renderDocumentDemand(reportData.documentDemand);
        renderRejectRate(reportData.rejectRateByDocument);
        renderWeekdayRequests(reportData.weekdayRequests);

    } catch (error) {
        console.error("Load reports error:", error);

        summaryContainer.innerHTML = `
            <p>Unable to load report data. Please try again.</p>
        `;
    }
}

// Render KPI cards
function renderSummaryCards(summary, statusBreakdown) {
    const rejected = Number(summary.rejected ?? 0);
    const processed = Number(summary.processed_requests ?? 0);
    const statusCount = status => Number(
        statusBreakdown.find(item => item.status === status)?.total_requests ?? 0
    );
    const cards = [
        {
            title: "Total Requests",
            value: summary.total_requests,
            detail: "Submitted in selected period"
        },
        {
            title: "In Progress",
            value: summary.in_progress,
            detail: `${statusCount("Pending")} pending · ${statusCount("Under Review")} under review`
        },
        {
            title: "Ready for Pickup",
            value: summary.ready_for_pickup,
            detail: "Approved, not yet collected"
        },
        {
            title: "Reject Rate",
            value: `${Number(summary.reject_rate || 0).toFixed(1)}%`,
            detail: processed > 0
                ? `${rejected} rejected of ${processed} processed`
                : "No processed requests in this period"
        }
    ];

    summaryContainer.innerHTML = cards.map(card => `
        <div class="report-summary-card">
            <p>${card.title}</p>
            <h3>${card.value ?? 0}</h3>
            <small class="report-summary-detail">${card.detail}</small>
        </div>
    `).join("");
}


let monthlyTrendChart = null;

function renderMonthlyTrend(data) {
    const canvas = document.getElementById("monthly-trend-chart");

    if (monthlyTrendChart) {
        monthlyTrendChart.destroy();
    }

    monthlyTrendChart = new Chart(canvas, {
        type: "line",
        data: {
            labels: data.map(item => item.month_label),
            datasets: [{
                label: "Total Requests",
                data: data.map(item => Number(item.total_requests)),
                borderWidth: 2,
                tension: 0.3,
                fill: false,
                pointRadius: 4,
                borderColor: chartColors.navy,
                pointBackgroundColor: chartColors.gold,
                pointBorderColor: chartColors.navy
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: "top"
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartColors.grid
                    },
                    ticks: {
                        color: chartColors.text,
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.text
                    }
                }
            }
        }
    });
}


let statusBreakdownChart = null;

function renderStatusBreakdown(data) {
    const canvas = document.getElementById("status-breakdown-chart");

    const statusLabels = [
        "Pending",
        "Under Review",
        "Approved",
        "Rejected",
        "Returned",
        "Released",
        "Cancelled"
    ];

    // Include statuses with zero requests
    const statusCounts = statusLabels.map(status => {
        const matchingStatus = data.find(
            item => item.status === status
        );

        return Number(matchingStatus?.total_requests || 0);
    });

    if (statusBreakdownChart) {
        statusBreakdownChart.destroy();
    }

    statusBreakdownChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: statusLabels,
            datasets: [{
                label: "Requests",
                data: statusCounts,
                borderWidth: 2,
                backgroundColor: [
                    chartColors.gold,
                    chartColors.blue,
                    chartColors.green,
                    chartColors.red,
                    chartColors.navy,
                    chartColors.slate,
                    chartColors.light
                ],
                borderColor: "#FFFFFF"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,

            hoverOffset: 18,

            animation: {
                duration: 700,
                easing: "easeOutQuart"
            },

            transitions: {
                active: {
                    animation: {
                        duration: 300
                    }
                }
            },

            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        color: chartColors.text,
                        boxWidth: 10,
                        padding: 12
                    }
                },

                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw} requests`;
                        }
                    }
                }
            }
        }
    });
}


let documentDemandChart = null;

function renderDocumentDemand(data) {
    const canvas = document.getElementById("document-demand-chart");

    if (documentDemandChart) {
        documentDemandChart.destroy();
    }

    documentDemandChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map(item => item.document_name),
            datasets: [{
                label: "Total Requests",
                data: data.map(item => Number(item.total_requests)),
                borderWidth: 1,
                backgroundColor: chartColors.navy,
                borderColor: chartColors.navy,
                borderRadius: 4,
                hoverBackgroundColor: "rgba(15, 60, 133, 0.96)"
            }]
        },
        options: {
            indexAxis: "y",
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.raw} requests`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    grid: {
                        color: chartColors.grid
                    },
                    ticks: {
                        color: chartColors.text,
                        precision: 0
                    }
                },
                y: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.text
                    }
                }
            }
        }
    });
}

let rejectRateChart = null;

function renderRejectRate(data) {
    const canvas = document.getElementById("reject-rate-chart");

    if (rejectRateChart) {
        rejectRateChart.destroy();
    }

    rejectRateChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: data.map(item => item.document_name),
            datasets: [{
                label: "Reject Rate (%)",
                data: data.map(item => Number(item.reject_rate)),
                borderWidth: 1,
                backgroundColor: chartColors.gold,
                borderColor: chartColors.gold,
                borderRadius: 4,
                hoverBackgroundColor: "rgba(231, 203, 76, 0.96)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${Number(context.raw).toFixed(1)}% rejected`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    grid: {
                        color: chartColors.grid
                    },
                    ticks: {
                        color: chartColors.text,
                        callback: value => `${value}%`
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.text
                    }
                }
            }
        }
    });
}

let weekdayRequestChart = null;

function renderWeekdayRequests(data) {
    const canvas = document.getElementById("weekday-request-chart");

    const weekdays = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday"
    ];

    const weekdayCounts = weekdays.map(day => {
        const matchingDay = data.find(
            item => item.day_name === day
        );

        return Number(matchingDay?.total_requests || 0);
    });

    if (weekdayRequestChart) {
        weekdayRequestChart.destroy();
    }

    weekdayRequestChart = new Chart(canvas, {
        type: "bar",
        data: {
            labels: weekdays,
            datasets: [{
                label: "Total Requests",
                data: weekdayCounts,
                borderWidth: 1,
                backgroundColor: chartColors.navy,
                borderColor: chartColors.navy,
                borderRadius: 4,
                hoverBackgroundColor: "rgba(15, 60, 133, 0.96)"
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: context => `${context.raw} requests`
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: chartColors.grid
                    },
                    ticks: {
                        color: chartColors.text,
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    },
                    ticks: {
                        color: chartColors.text
                    }
                }
            }
        }
    });
}


function exportReportsCSV() {
    if (!reportData) {
        alert("No report data available to export.");
        return;
    }

    const rows = [];

    // Helper to add CSV sections
    function addSection(title, headers, data) {
        rows.push([title]);
        rows.push(headers);

        data.forEach(item => {
            rows.push(item);
        });

        rows.push([]);
    }

    // KPI Summary
    addSection("Report Summary", ["Metric", "Value"], [
        ["Total Requests", reportData.summary.total_requests],
        ["In Progress", reportData.summary.in_progress],
        ["Ready for Pickup", reportData.summary.ready_for_pickup],
        ["Reject Rate (%)", reportData.summary.reject_rate]
    ]);

    // Monthly Trend
    addSection("Monthly Request Trend", ["Month", "Total Requests"],
        reportData.monthlyTrend.map(item => [
            item.month_label,
            item.total_requests
        ])
    );

    // Status Breakdown
    addSection("Requests per Status", ["Status", "Total Requests"],
        reportData.statusBreakdown.map(item => [
            item.status,
            item.total_requests
        ])
    );

    // Document Demand
    addSection("Document Demand", ["Document", "Total Requests"],
        reportData.documentDemand.map(item => [
            item.document_name,
            item.total_requests
        ])
    );

    // Reject Rate
    addSection("Reject Rate by Document",
        ["Document", "Rejected Requests", "Processed Requests", "Reject Rate (%)"],
        reportData.rejectRateByDocument.map(item => [
            item.document_name,
            item.rejected_requests,
            item.processed_requests,
            item.reject_rate
        ])
    );

    // Weekday Requests
    addSection("Requests by Day of the Week",
        ["Day", "Total Requests"],
        reportData.weekdayRequests.map(item => [
            item.day_name,
            item.total_requests
        ])
    );

    // Escape CSV values
    const csvContent = rows.map(row =>
        row.map(value => {
            const text = String(value ?? "");
            return `"${text.replace(/"/g, '""')}"`;
        }).join(",")
    ).join("\r\n");

    // Add UTF-8 BOM for spreadsheet compatibility
    const blob = new Blob(
        ["\uFEFF" + csvContent],
        { type: "text/csv;charset=utf-8;" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = "barangay_reports_analytics.csv";

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
}

function exportReportsPDF() {
    if (!reportData) {
        alert("No report data available to export.");
        return;
    }

    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    const pageWidth = doc.internal.pageSize.getWidth();

    const dateFrom = dateFromInput.value || "All available dates";
    const dateTo = dateToInput.value || "Present";

    let currentY = 20;

    // Report title
    doc.setFontSize(18);
    doc.text("Barangay Reports & Analytics", 14, currentY);

    currentY += 10;

    // Report date range
    doc.setFontSize(10);
    doc.text(`Date From: ${dateFrom}`, 14, currentY);
    doc.text(`Date To: ${dateTo}`, pageWidth - 14, currentY, {
        align: "right"
    });

    currentY += 12;

    // Summary
    doc.setFontSize(14);
    doc.text("Report Summary", 14, currentY);

    doc.autoTable({
        startY: currentY + 4,
        head: [["Metric", "Value"]],
        body: [
            ["Total Requests", reportData.summary.total_requests],
            ["In Progress", reportData.summary.in_progress],
            ["Ready for Pickup", reportData.summary.ready_for_pickup],
            ["Reject Rate", `${Number(reportData.summary.reject_rate || 0).toFixed(1)}%`]
        ],
        theme: "grid"
    });

    // Monthly Trend
    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.text("Monthly Request Trend", 14, currentY);

    doc.autoTable({
        startY: currentY + 4,
        head: [["Month", "Total Requests"]],
        body: reportData.monthlyTrend.map(item => [
            item.month_label,
            item.total_requests
        ]),
        theme: "grid"
    });

    // Status Breakdown
    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.text("Requests per Status", 14, currentY);

    doc.autoTable({
        startY: currentY + 4,
        head: [["Status", "Total Requests"]],
        body: reportData.statusBreakdown.map(item => [
            item.status,
            item.total_requests
        ]),
        theme: "grid"
    });

    // Document Demand
    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.text("Document Demand", 14, currentY);

    doc.autoTable({
        startY: currentY + 4,
        head: [["Document", "Total Requests"]],
        body: reportData.documentDemand.map(item => [
            item.document_name,
            item.total_requests
        ]),
        theme: "grid"
    });

    // Reject Rate
    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.text("Reject Rate by Document", 14, currentY);

    doc.autoTable({
        startY: currentY + 4,
        head: [[
            "Document",
            "Rejected",
            "Processed",
            "Reject Rate (%)"
        ]],
        body: reportData.rejectRateByDocument.map(item => [
            item.document_name,
            item.rejected_requests,
            item.processed_requests,
            `${Number(item.reject_rate).toFixed(1)}%`
        ]),
        theme: "grid"
    });

    // Weekday Requests
    currentY = doc.lastAutoTable.finalY + 12;

    doc.setFontSize(14);
    doc.text("Requests by Day of the Week", 14, currentY);

    doc.autoTable({
        startY: currentY + 4,
        head: [["Day", "Total Requests"]],
        body: reportData.weekdayRequests.map(item => [
            item.day_name,
            item.total_requests
        ]),
        theme: "grid"
    });

    // Reminder
    currentY = doc.lastAutoTable.finalY + 12;

    if (currentY > doc.internal.pageSize.getHeight() - 35) {
        doc.addPage();
        currentY = 20;
    }

    doc.setFontSize(9);
    doc.text(
        "Exports contain aggregate reports only and do not include issued document soft copies.",
        14,
        currentY,
        { maxWidth: pageWidth - 28 }
    );

    currentY += 8;

    doc.text(
        "All figures shown are sample data for this concept proposal.",
        14,
        currentY,
        { maxWidth: pageWidth - 28 }
    );

    // Save PDF
    doc.save("barangay_reports_analytics.pdf");
}


// Apply date filter
applyFilterBtn.addEventListener("click", () => {
    const dateFrom = dateFromInput.value;
    const dateTo = dateToInput.value;

    if (dateFrom && dateTo && dateFrom > dateTo) {
        alert("The start date cannot be later than the end date.");
        return;
    }

    loadReports(dateFrom, dateTo);
});

// Reset date filter
resetFilterBtn.addEventListener("click", () => {
    dateFromInput.value = "";
    dateToInput.value = "";

    loadReports();
});

// Initial loading
loadReports().finally(() => window.finishPageSkeleton?.());

const exportCSVBtn = document.getElementById("export-csv-btn");
const exportPDFBtn = document.getElementById("export-pdf-btn");

exportCSVBtn.addEventListener("click", exportReportsCSV);
exportPDFBtn.addEventListener("click", exportReportsPDF);
