router.get("/documents", async (req, res) => {
    try {
        const [documents] = await db.query(`
            SELECT
                document_id,
                document_name,
                description
            FROM DOCUMENT
            WHERE availability = 'Available'
            ORDER BY document_name ASC
        `);

        res.json(documents);

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Unable to retrieve documents."
        });
    }
});