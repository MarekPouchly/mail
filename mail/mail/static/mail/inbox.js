document.addEventListener('DOMContentLoaded', function() {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);

  document.querySelector('form').addEventListener('submit', sendEmail)

  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-details').style.display = 'none';

  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {
  
  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'none';

  // Show the mailbox name
  document.querySelector('#emails-view').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;

  fetch(`/emails/${mailbox}`)
  .then(response => response.json())
  .then(emails => {
      if (mailbox === 'inbox' || mailbox === 'sent') {
        printEmails(emails)
      } else if (mailbox === 'archive') {
        printEmails(emails)
      }
  });
}

function sendEmail() {

  const recipients = document.querySelector('#compose-recipients').value;
  const subject = document.querySelector('#compose-subject').value;
  const body = document.querySelector('#compose-body').value;

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
      load_mailbox('sent');
  });
}

function printEmails(emails) {
  for (let i=0; i<emails.length; i++) {
    const element = document.createElement('div');
    element.classList.add('container', 'text-cente')

    if (emails[i].read === false) {
      element.classList.add('bg-white')
    } else if (emails[i].read === true) {
      element.classList.add('bg-light')
    }

    element.innerHTML = `
      <div class="row py-3">
        <div class="col-sm-4 text-left ">
          ${emails[i].sender}
        </div>
        <div id="subject-${emails[i].id}" class="col-sm-6 text-left subject-archive">
          ${emails[i].subject}
          <button style="display: none;"></button>
        </div>
        <div class="col-sm-2 text-right">
          ${emails[i].timestamp}
        </div>
      </div>

    <hr style=margin:0;>
    `

    // On click show email details
    element.addEventListener('click', () => emailDetails(emails[i].id));

    // append element to the emails view
    document.querySelector('#emails-view').append(element);
  }
}

function emailDetails(specific_email) {
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-details').style.display = 'block';

  document.querySelector('#email-details').innerHTML = ''

  fetch(`/emails/${specific_email}`)
  .then(response => response.json())
  .then(email => {
    
    // Readed
    fetch(`/emails/${email.id}`, {
      method: 'PUT',
      body: JSON.stringify({
          read: true
      })
    })

    // Print email
    const element = document.createElement('div')
    element.innerHTML =  `
      <p>
        <strong>From: </strong>${email.sender} <br>
        <strong>To: </strong>${email.recipients} <br>
        <strong>Subject: </strong>${email.subject} <br>
        <strong>Timestamp: </strong>${email.timestamp}
      </p>

      <hr>

      ${email.body}<br>
    `
    document.querySelector('#email-details').append(element);

    // Archive/Unarchive button
    const archButton = document.createElement('button');
    archButton.innerHTML = email.archived ? 'Unarchive' : 'Archive'
    archButton.className = email.archived ? 'btn btn-danger' : 'btn btn-success'
    archButton.addEventListener('click', function() {
      fetch(`/emails/${email.id}`, {
        method: 'PUT',
        body: JSON.stringify({
            archived: !email.archived
        })
      })
      .then(() => load_mailbox('archive'))
    });
    document.querySelector('#email-details').append(archButton);

    
    const replyButton = document.createElement('button');
    replyButton.innerHTML = 'Reply';
    replyButton.className = 'btn btn-info'
    replyButton.addEventListener('click', function() {
      compose_email()

      document.querySelector('#compose-recipients').value = `${email.sender}`;
      let subject = email.subject
      if (subject.split(' ', 1)[0] != "Re:") {
        subject = "Re: " + email.subject
      }
      document.querySelector('#compose-subject').value = subject;
      document.querySelector('#compose-body').value = `On: ${email.timestamp} ${email.sender} wrote: ${email.body}<br>`;
    });
    document.querySelector('#email-details').append(replyButton);
  });
}