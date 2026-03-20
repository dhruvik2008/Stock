
(function testLowStock() {
    console.log("Starting Low Stock Test...");

    // 1. Create a dummy design
    const testDesignName = "TEST-DESIGN-999";
    let designs = JSON.parse(localStorage.getItem('vastra_designs') || '[]');
    if (!designs.find(d => d.name === testDesignName)) {
        designs.push({
            id: Date.now(),
            name: testDesignName,
            price: 500,
            category: "Test",
            createdAt: new Date().toISOString()
        });
        localStorage.setItem('vastra_designs', JSON.stringify(designs));
        console.log("1. Created Test Design:", testDesignName);
    }

    // 2. Add some stock for it (Pack Design)
    // Let's add 50 pcs stock
    let packs = JSON.parse(localStorage.getItem('vastra_packs') || '[]');
    packs.push({
        id: Date.now() + 1,
        dateTime: new Date().toISOString(),
        items: [{ designName: testDesignName, name: testDesignName, qty: 50, rate: 500, size: 'M' }],
        customerName: "Initial Stock",
        createdAt: new Date().toISOString()
    });
    localStorage.setItem('vastra_packs', JSON.stringify(packs));
    console.log("2. Added 50 pcs stock.");

    // 3. Add heavy sales in the last 15 days (Delivery Challan)
    // Let's sell 100 pcs in the last 15 days.
    // This will make 15-day average high, but current stock (50) will be LOW.
    let challans = JSON.parse(localStorage.getItem('vastra_challans') || '[]');
    const tenDaysAgo = new Date();
    tenDaysAgo.setDate(tenDaysAgo.getDate() - 10);

    challans.push({
        id: Date.now() + 2,
        number: "TEST-CH-001",
        date: tenDaysAgo.toISOString(),
        customerName: "Test Customer",
        items: [{ designName: testDesignName, qty: 100, rate: 500, size: 'M' }],
        createdAt: tenDaysAgo.toISOString()
    });
    localStorage.setItem('vastra_challans', JSON.stringify(challans));
    console.log("3. Created Sales of 100 pcs (10 days ago).");
    console.log("Current Stock: 50 | 15-Day Sales: 100.");
    console.log("Prediction for next 15 days will be 100. Since 50 < 100, it SHOULD show in Low Stock Alert.");

    alert("Test data created!\n1. Go to 'Low Stock Alert' section.\n2. You should see '" + testDesignName + "' with Requirement of +50.");
})();
