const express = require('express');
const app = express();
const MongoClient = require('mongodb').MongoClient;
const ObjectID = require('mongodb').ObjectID;
const assert = require('assert');
const fs = require('fs');
const formidable = require('express-formidable');
const mongourl = 'mongodb+srv://admin:admin@cluster0.toqh1.mongodb.net/Restaurant?retryWrites=true&w=majority';
const dbName = 'Restaurant';
const session = require("cookie-session")
const bodyParser = require('body-parser');

app.use(formidable());
app.set('view engine', 'ejs');
const SECRETKEY = 'I want to pass COMPS381F';

const users = new Array(
	{name: 'developer', password: 'developer'},
	{name: 'guest', password: 'guest'}
);

app.use(session({
    name: 'loginSession',
    keys: [SECRETKEY]
  }));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const findDocument = (db, criteria, callback) => {
    let cursor = db.collection('restaurant').find(criteria);
    console.log(`findDocument: ${JSON.stringify(criteria)}`);
    cursor.toArray((err,docs) => {
        assert.equal(err,null);
        console.log(`findDocument: ${docs.length}`);
        callback(docs);
    });
}

const handle_Find = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        findDocument(db, criteria, (docs) => {
            client.close();
            console.log("Closed DB connection");
            console.log(docs)
            res.status(200).render('list',{nRes: docs.length, restaurants: docs});
        });
    });
}

const handle_Details = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        findDocument(db, DOCID, (docs) => {  // docs contain 1 document (hopefully)
            client.close();
            console.log("Closed DB connection");
            res.status(200).render('details', {booking: docs[0]});
        });
    });
}

const handle_Edit = (res, criteria) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

        /* use Document ID for query */
        let DOCID = {};
        DOCID['_id'] = ObjectID(criteria._id)
        let cursor = db.collection('bookings').find(DOCID);
        cursor.toArray((err,docs) => {
            client.close();
            assert.equal(err,null);
            res.status(200).render('edit',{booking: docs[0]});
        });
    });
}

const updateDocument = (criteria, updateDoc, callback) => {
    const client = new MongoClient(mongourl);
    client.connect((err) => {
        assert.equal(null, err);
        console.log("Connected successfully to server");
        const db = client.db(dbName);

         db.collection('bookings').updateOne(criteria,
            {
                $set : updateDoc
            },
            (err, results) => {
                client.close();
                assert.equal(err, null);
                callback(results);
            }
        );
    });
}

const handle_Update = (req, res, criteria) => {
        var DOCID = {};
        DOCID['_id'] = ObjectID(req.fields._id);
        var updateDoc = {};
        updateDoc['bookingid'] = req.fields.bookingid;
        updateDoc['mobile'] = req.fields.mobile;
        if (req.files.filetoupload.size > 0) {
            fs.readFile(req.files.filetoupload.path, (err,data) => {
                assert.equal(err,null);
                updateDoc['photo'] = new Buffer.from(data).toString('base64');
                updateDocument(DOCID, updateDoc, (results) => {
                    res.status(200).render('info', {message: `Updated ${results.result.nModified} document(s)`})
                });
            });
        } else {
            updateDocument(DOCID, updateDoc, (results) => {
                res.status(200).render('info', {message: `Updated ${results.result.nModified} document(s)`})
            });
        }
}

app.get('/list', (req,res) => {
    handle_Find(res, req.query.docs);
})


app.get('/', (req,res) => {
    if (!req.session.authenticated) {    // user not logged in!
		res.redirect('/login');
	} else {
		res.redirect('/list')
	}
});

app.get('/login', (req,res) => {
	res.status(200).render('login',{});
});

app.post('/login', (req,res) => {
    console.log("login")
    console.log(req)
    console.log(req.body.password)
	// users.forEach((user) => {
	// 	if (user.name == req.body.name && user.password == req.body.password) {
	// 		// correct user name + password
	// 		// store the following name/value pairs in cookie session
	// 		req.session.authenticated = true;        // 'authenticated': true
	// 		req.session.username = req.body.name;	 // 'username': req.body.name		
	// 	}
	// });
	res.send("hi")
});

app.get('/logout', (req,res) => {
	req.session = null;   // clear cookie-session
	res.redirect('/');
});

// app.get('/details', (req,res) => {
//     handle_Details(res, req.query);
// })

// app.get('/edit', (req,res) => {
//     handle_Edit(res, req.query);
// })

// app.post('/update', (req,res) => {
//     handle_Update(req, res, req.query);
// })

// app.get('/*', (req,res) => {
//     //res.status(404).send(`${req.path} - Unknown request!`);
//     res.status(404).render('info', {message: `${req.path} - Unknown request!` });
// })

app.listen(app.listen(process.env.PORT || 8099));