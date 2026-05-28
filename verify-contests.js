const https = require('https');

const SUPABASE_URL = 'https://ujvwswedoxsqhkpngeag.supabase.co';
const SUPABASE_KEY = 'sb_publishable_vdjkRAIGBzkZt_BgG4nlNw_yyrui2kS';

const validRegions = ['충청북도', '충청남도', '세종특별자치시', '대전광역시'];

async function fetchContests() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'ujvwswedoxsqhkpngeag.supabase.co',
      port: 443,
      path: '/rest/v1/contests?select=*&limit=5',
      method: 'GET',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          console.log('Raw response:', typeof parsed, Array.isArray(parsed) ? 'is array' : 'not array');
          resolve(parsed);
        } catch (e) {
          reject(new Error(`Failed to parse response: ${data.substring(0, 200)}`));
        }
      });
    });

    req.on('error', reject);
    req.setTimeout(5000);
    req.end();
  });
}

async function run() {
  try {
    console.log('🔍 Fetching contests from Supabase...');
    const response = await fetchContests();

    console.log('Full response:', JSON.stringify(response, null, 2));

    if (!Array.isArray(response)) {
      console.error('❌ Response is not an array. It might be an error.');
      if (response.message) {
        console.error('Error message:', response.message);
      }
      return;
    }

    const contests = response;
    console.log(`\n📊 Total contests found: ${contests.length}\n`);

    const invalidContests = contests.filter(c => !validRegions.includes(c.region));
    const validContests = contests.filter(c => validRegions.includes(c.region));

    if (invalidContests.length === 0) {
      console.log('✅ All contests have valid Chungcheong regions!');
      console.log(`   - 충청북도: ${contests.filter(c => c.region === '충청북도').length}`);
      console.log(`   - 충청남도: ${contests.filter(c => c.region === '충청남도').length}`);
      console.log(`   - 세종특별자치시: ${contests.filter(c => c.region === '세종특별자치시').length}`);
      console.log(`   - 대전광역시: ${contests.filter(c => c.region === '대전광역시').length}`);
    } else {
      console.log(`⚠️  Found ${invalidContests.length} contests with INVALID regions:\n`);
      invalidContests.forEach(c => {
        console.log(`   ❌ "${c.title}"`);
        console.log(`      ID: ${c.id}`);
        console.log(`      Region: ${c.region}`);
        console.log(`      Field: ${c.field}`);
      });
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

run();
