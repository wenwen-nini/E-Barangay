function isValidNonFutureDate(value) {
    if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return false;
    }

    const date = new Date(`${value}T00:00:00.000Z`);
    if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
        return false;
    }

    const now = new Date();
    const today = new Date(Date.UTC(
        now.getFullYear(),
        now.getMonth(),
        now.getDate()
    )).toISOString().slice(0, 10);

    return value <= today;
}

module.exports = { isValidNonFutureDate };
