document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#open-email-view').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';

  // Listen for form submission
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    // Use API to send the email to the database
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
    })
    .then(load_mailbox('inbox'));

    // Return false to prevent default form submission
    return false;
  };
};

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#open-email-view').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  // Use the api to fetch the specific mailbox and display email information in their own divs
  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
    console.log(emails);
    emails.forEach(element => {
      const email_div = document.createElement('div');

      // Open the email if the user clicks on it
      email_div.addEventListener('click', () => {
        open_email(element.id);
      });

      // Check whether the email is read or unread and apply specific class to it
      if (!element.read)  {
        email_div.className = 'email unread row';
      }
      else {
        email_div.className = 'email read row';
      }

      // Send information to be displayed in HTML page
      email_div.innerHTML = 
      `<h5 class="col-3 sender">${element.sender}</h5> 
      <h5 class="col subject">${element.subject}</h5> 
      <h5 class="col-2 timestamp">${element.timestamp}</h5>`;
      document.querySelector('#emails-view').append(email_div);
    });
  });
};

function reply(recipient, subject, body, timestamp) {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#open-email-view').style.display = 'none';

  // Fill out composition fields
  document.querySelector('#compose-recipients').value = `${recipient}`;

  // Check whether the subject begins with "Re:" case insensitively
  let sub = subject.substring(0, 3).toUpperCase();
  if (sub == "RE:") {
    document.querySelector('#compose-subject').value = `${subject}`;
  }
  else if (!sub == "RE:"){
    document.querySelector('#compose-subject').value = `Re: ${subject}`;
  }

  document.querySelector('#compose-body').value = 
  `
  On ${timestamp} ${recipient} wrote:
  ${body}`;

  // Listen for form submission
  document.querySelector('#compose-form').onsubmit = () => {
    const recipients = document.querySelector("#compose-recipients").value;
    const subject = document.querySelector("#compose-subject").value;
    const body = document.querySelector("#compose-body").value;

    // Use API to send the email to the database
    fetch('/emails', {
      method: 'POST',
      body: JSON.stringify({
        recipients: recipients,
        subject: subject,
        body: body
      })
    })
    .then(response => response.json())
    .then(result => {
      // Print result
      console.log(result);
    })
    .then(load_mailbox('inbox'));

    // Return false to prevent default form submission
    return false;
  };
};


function open_email(email_id) {

  // Hide every view aside from open-email view
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#open-email-view').style.display = 'block';

  // Fetch the email using id from the argument
  fetch(`/emails/${email_id}`)
  .then(response => response.json())
  .then(email => {
      // Print email
      console.log(email);

      if (email.read) {
        // Do nothing
      }
      else {
        // Change the read boolean in JSON file to true
        fetch(`/emails/${email_id}`, {
          method: 'PUT',
          body: JSON.stringify({
              read: true
          })
        });
      }

      // Check if the email is in 'sent' mailbox by comparing sender to current user
      const user_email = document.getElementById("user-email").getAttribute('data-email');
      if (email.sender == user_email) {
        document.querySelector("#div-archive").style.display = 'none';
        document.querySelector("#btn-reply").style.display = 'none';
      }
      else {
        document.querySelector("#div-archive").style.display = 'block';
        document.querySelector("#btn-reply").style.display = 'block';
      }

      // Check if the email is archived and display the appropriate button
      if (!email.archived) {
        document.getElementById("div-archive").innerHTML = '<button class="btn btn-danger" id="btn-archive">Archive</button>';
        if (document.getElementById("btn-archive")) {
          document.getElementById("btn-archive").addEventListener('click', () => {
            fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: true
              })
            })
            // Setting the timeout is crucial for the server to catch up with updating the archived e-mail
            // Instant load_mailbox function causes the website to still display archived e-mails
            setTimeout(() => {
              load_mailbox('inbox');
            }, 100);
          });
        }
      }
      else {
        document.getElementById("div-archive").innerHTML = `<button class="btn btn-secondary" id="btn-unarchive">Unarchive</button>`;
        if (document.getElementById("btn-unarchive")){
          document.getElementById("btn-unarchive").addEventListener('click', () => {
            fetch(`/emails/${email_id}`, {
              method: 'PUT',
              body: JSON.stringify({
                  archived: false
              })
            })
            // Setting the timeout is crucial for the server to catch up with updating the archived e-mail
            // Instant load_mailbox function causes the website to still display archived e-mails
            setTimeout(() => {
              load_mailbox('inbox');
            }, 100);
          });
        }
      }
      
      // Make reply button and listen 
      document.getElementById("btn-reply").innerHTML = `<button class="btn btn-primary">Reply</button>`;
      document.getElementById("btn-reply").addEventListener('click', () => {
        reply(email.sender, email.subject, email.body, email.timestamp);
      });

      // Send the JSON information to HTML page
      document.getElementById("oe-sender").innerHTML = `From: ${email.sender}`;
      document.getElementById("oe-recipients").innerHTML = `To: ${email.recipients}`;
      document.getElementById("oe-subject").innerHTML = email.subject;
      document.getElementById("oe-timestamp").innerHTML = email.timestamp;
      document.getElementById("oe-content").innerHTML = email.body;
  });
};
