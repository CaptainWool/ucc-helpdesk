const API_KEY = "AIzaSyAn_UXumzYZCtqZsag565S8fcvi7FCPxD0";
const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

async function check() {
    try {
        const response = await fetch(url);
        const data = await response.json();
        const models = data.models.map(m => m.name);

        console.log("Filtered models:");
        models.forEach(m => {
            if (m.includes('gemini') && m.includes('flash')) {
                console.log(m);
            }
            if (m.includes('gemini') && m.includes('pro')) {
                console.log(m);
            }
        });
    } catch (e) {
        console.error("Fetch failed:", e.message);
    }
}

check();
