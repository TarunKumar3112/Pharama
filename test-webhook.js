import axios from 'axios';

async function test() {
    console.log("Testing n8n webhook GET from Node.js...");
    try {
        const res = await axios.get("https://myaidesigntools.app.n8n.cloud/webhook/fodse2", 
            { 
              params: { message: "hi" },
              timeout: 300000 
            }
        );
        console.log("Success!", res.status, res.data);
    } catch (err) {
        if (err.response) {
            console.log("Error Response:", err.response.status, err.response.data);
        } else {
            console.log("Error:", err.message);
        }
    }
}

test();
