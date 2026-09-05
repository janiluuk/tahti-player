const fs = require('fs');
let content = fs.readFileSync('packages/tahti-web/src/views/settings/SettingsPanels.tsx', 'utf8');

// Remove the Governance link from the account panel
const oldLink = `              <Link to="/governance" onClick={closeSettings}>
                <Button size="sm" variant="secondary">
                  <Landmark size={15} aria-hidden className="mr-1.5" />
                  Governance
                </Button>
              </Link>`;

const newLink = ``;

// Remove the link (including the preceding newline)
content = content.replace(oldLink, '');

// Also remove the blank line that may be left
content = content.replace(/\n\n\n+/, '\n\n');

fs.writeFileSync('packages/tahti-web/src/views/settings/SettingsPanels.tsx', content, 'utf8');
console.log('Done - governance link removed');