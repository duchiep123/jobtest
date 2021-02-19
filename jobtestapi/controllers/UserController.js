var express = require('express');
var router = express.Router();
var User = require('../models/User');
var sercretKey = "nguyenduchiepnguyenduchiep";
var jwt = require('jsonwebtoken');
var admin = require('firebase-admin');
const uuid = require('uuid-v4');
var fs = require('fs');
var multer = require('multer');
var helpers = require('../helper');
var serviceAccount = require("../path/feedbacksystem-282204-firebase-adminsdk-mqdb0-7daeea3c24.json");
var nodemailer = require('nodemailer');
var pdfparse = require('pdf-parse');
var textract = require('textract');
const { response } = require('../app/app');
var path = require('path');
//router.use(express.static(__dirname + '/public'));

router.use(express.json());

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://feedbacksystem-282204.firebaseio.com"
});

var bucket = admin.storage().bucket('feedbacksystem-282204.appspot.com');
const db = admin.firestore();



var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'mrhiep314@gmail.com',
        pass: 'ZZNGUYENDUCHIEPZZ'
    }
});

// var mailOptions = {
//     from: 'youremail@gmail.com',
//     to: 'myfriend@yahoo.com', // muốn send nhiều thì , cái r ghi tiếp mail
//     subject: 'Sending Email using Node.js',
//     text: 'That was easy!',
//     html: '<h1>Welcome</h1><p>That was easy!</p>'
// };

router.post('/emails/send', (req, res) => {
    var mailOptions = {
        from: "mrhiep314@gmail.com",
        to: req.body.to,
        subject: req.body.subject,
        text: req.body.text
    };
    transporter.sendMail(mailOptions).then((info) => {
        return res.status(200).json();
    }).catch((err) => {
        return res.status(500).json({ message: "Server error." });
    });

    // transporter.sendMail(mailOptions, function(err, info) {
    //     if (err) {
    //         return res.status(500).json({ message: "Server error." });
    //     } else {
    //         console.log(info);
    //         console.log(info.response);
    //         return res.status(200).json();
    //     }
    // });
});

// const storage = multer.diskStorage({
//     destination: function(req, file, cb) {
//         cb(null, 'uploads/');
//     },
//     // By default, multer removes file extensions so let's add them back
//     filename: function(req, file, cb) {
//         cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
//     }
// });
const multer2 = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
    //fileFilter: helpers.imageFilter
});

const multer3 = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // no larger than 5mb, you can change as needed.
    }
});


// router.post('/upload-profile-pic', (req, res) => {
//     // 'profile_pic' is the name of our file input field in the HTML form
//     let upload = multer({ storage: storage, fileFilter: helpers.imageFilter }).single('myimage');
//     upload(req, res, function(err) {
//         // req.file contains information of uploaded file
//         // req.body contains information of text fields, if there were any

//         if (req.fileValidationError) {
//             return res.send(req.fileValidationError);
//         } else if (!req.file) {
//             return res.send('Please select an image to upload');
//         } else if (err instanceof multer.MulterError) {
//             return res.send(err);
//         } else if (err) {
//             return res.send(err);
//         }

//         // Display uploaded image for user validation
//         res.send(`You have uploaded this image: <hr/><img src="${req.file.path}" width="500"><hr /><a href="./">Upload another image</a>`);
//     });
// });


//Returns a Multer instance that provides several methods for generating middleware that process files uploaded in multipart/form-data format
router.post('/upload', multer2.single('file'), (req, res) => { // multer
    console.log('Upload Image');
    let file = req.file;
    let newFileName = `${file.originalname}`;
    let fileUpload = bucket.file('myimage/' + newFileName);
    const blobStream = fileUpload.createWriteStream({ //blobstream is a variable that contains the stream of the blob data of your file... blobstream "mount" or "transform" blob data in your file....
        metadata: {
            contentType: file.mimetype
        }
    });
    uploadImageFile(fileUpload, file).then(() => {
        getUrlFilename(fileUpload).then((success) => {
            return res.status(200).json({ url: success });
        }).catch((error) => {
            console.log(error);
            return res.status(500).json({ messgae: "Get url filename error." });
        })
    }).catch((error) => {
        console.log(error);
        return res.status(500).json({ messgae: "Server error." });
    });
});

router.delete('/file/:name', (req, res) => {
    var name = req.params.name;
    bucket.file('myimage/' + name).delete().then((success) => {
        console.log(success);
        return res.status(200).json();
    }).catch((error) => {
        return res.status(500).json();
    });
});

router.get('/file/:name', (req, res) => {
    var name = req.params.name;
    console.log(name);
    let x = bucket.file('myimage/' + name);

    x.download().then((r) => {
        console.log(r[0]); // buffer
        return res.status(200).json();
    }).catch((error) => {
        console.log(error);
        return res.status(500).json();
    });
});


router.get('/download/file/:name', (req, res) => {
    var name = req.params.name;
    var downloadFolder = process.env.USERPROFILE + '/Downloads/';
    const localFilename = downloadFolder + name;
    var e = process.cwd() + '/uploads/';
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: localFilename,
    };
    // bucket.file('myimage/' + name).createReadStream()
    //     .on('error', function(err) {
    //         console.log(err);
    //         return res.status(500).json();
    //     })
    //     .on('response', function(response) {
    //         // Server connected and responded with the specified status and headers.
    //     })
    //     .on('end', function() {
    //         return res.status(200).json();
    //         // The file is fully downloaded.
    //     })
    //     .pipe(fs.createWriteStream(localFilename));

    bucket.file('myimage/' + name).download(options).then(() => {
        console.log('Downloaded.');
        return res.status(200).json();
    }).catch((error) => {
        console.log(error);
        return res.status(500).json();
    });
});

router.get('/download/firebase/:name', (req, res) => { //SSC102-CV-Coverletter-Nguyen Duc Hiep.pdf

    var name = req.params.name;
    var path = process.cwd() + '/uploads/';
    const options = {
        // The path to which the file should be downloaded, e.g. "./file.txt"
        destination: path + name,
    };
    bucket.file('myimage/' + name).download(options).then(() => {
        res.download(path + name, name, (err) => {
            if (err) {
                console.log(err);
            } else {
                fs.unlinkSync(path + name);
                console.log('Downloaded.');
            }
        });
    }).catch((error) => {
        console.log(error);
        return res.status(500).json();
    });


});

router.post('/uploadmulti', multer2.array('files', 10), (req, res) => { // multer
    console.log('Upload Image');
    let files = req.files;
    let listUrl = [];
    var x;
    for (x = 0; x < files.length; x++) {
        let file = files[x];
        let newFileName = `${file.originalname}`;
        let fileUpload = bucket.file('myimage/' + newFileName);
        uploadImageFile(fileUpload, file).then(() => {
            getUrlFilename(fileUpload).then((success) => {
                listUrl.push(success);
                if (listUrl.length == files.length) {
                    return res.status(200).json({ listUrl });
                }
            }).catch((error) => {
                console.log(error);
                return res.status(500).json({ messgae: "Get url filename error." });
            })
        }).catch((error) => {
            console.log(error);
            return res.status(500).json({ messgae: "Server error." });
        });
    }

});

router.post('/files', multer3.single('file'), (req, res) => {
    var buffer = req.file.buffer;
    if (req.file.mimetype == 'application/pdf') {
        pdfparse(buffer).then(function(data) {
            console.log(data.numpages);
            console.log('----------------');
            var content = data.text;
            if (content.includes("C#")) {
                console.log("true");
            }
            return res.status(200).json();
        }).catch((err) => {
            console.log(err);
            return res.status(500).json();
        });
    } else {
        textract.fromBufferWithMime(req.file.mimetype, buffer, function(error, text) { // doc dc word vs txt
            if (error) {
                console.log(error);
                return res.status(500).json();
            } else {
                if (text.includes("C#")) {
                    console.log("true");
                }
                return res.status(200).json();
            }
        });
    }
});



var getUrlFilename = function(fileUpload) {
    return new Promise((resolve, reject) => {
        fileUpload.getSignedUrl({
            action: 'read',
            expires: '03-06-2491'
        }).then(signedUrls => {
            resolve(signedUrls[0]);
        }).catch((error) => {
            reject('Something wrong.');
        });
    })
}
var uploadImageFile = function(fileUpload, file) {
    return new Promise((resolve, reject) => {
        if (!file) {
            reject('No image file');
        }

        const blobStream = fileUpload.createWriteStream({ //blobstream is a variable that contains the stream of the blob data of your file... blobstream "mount" or "transform" blob data in your file....
            metadata: {
                contentType: file.mimetype
            }
        });
        blobStream.on('error', (error) => {
            console.log(error);
            reject('Something is wrong! Unable to upload at the moment.');
        });
        blobStream.on('finish', () => {
            resolve();
        });

        blobStream.end(file.buffer);
    });
};
// Create new user
router.post('/', (req, res) => {
    var newUser = {
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        status: 1
    };
    User.find({ email: req.body.email }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Server error." });
        } else if (user) {
            return res.status(200).json({ message: "The email has been used." });
        }
        User.create(newUser, (err, user) => {
            if (err) {
                return res.status(500).json({ message: "There was a problem adding the information to the database." });
            }
            res.status(200).json(user);
        });

    });



});


// get all user
router.get('/', verifyToken, (req, res) => {
    User.find({}, (err, users) => {
        if (err) {
            return res.status(500).json({ message: "Server error" });
        }
        res.status(200).json(users);
    });
});

//Get single user by id 
router.get('/:id', verifyToken, (req, res) => {
    User.findById(req.params.id, (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Server error." });
        } else if (!user) {
            return res.status(200).json({ message: "No user found." });
        }
        res.status(200).json(user);
    });
});


// remove user by update status
router.delete('/:id', (req, res) => {
    User.findByIdAndUpdate(req.params.id, { $set: { "status": 0 } }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Server error." });
        } else if (!user) {
            return res.status(200).json({ message: "No found user to delete." });
        }
        res.status(200).json({ message: "Delete success!" });
    })
});

// update user
router.put('/:id', (req, res) => {
    User.findByIdAndUpdate(req.params.id, req.body, { new: true }, (err, user) => {
        if (err) {
            return res.status(500).json({ messgae: "Server error." });
        } else if (!user) {
            return res.status(200).json({ message: "No found user to update." });
        }
        res.status(200).json(user);
    });
});

router.post('/login', (req, res) => {
    // User.find => neeus ko co se tra ve mot array rong~
    User.findOne({ email: req.body.email, password: req.body.password, status: 1 }, { email: 1, name: 1 }, (err, user) => {
        if (err) {
            return res.status(500).json({ message: "Server error. " });
        } else if (!user) {
            return res.status(200).json({ messgae: "Email or password maybe incorrect." });
        }
        jwt.sign({ name: user.name }, sercretKey, { expiresIn: "1h" }, (err, token) => {
            if (err) {
                return res.status(500).json({ messgae: "Server error." });
            }
            res.status(200).json({ token });
        })
    });
});
//expiresIn: "10h" // it will be expired after 10 hours
//expiresIn: "20d" // it will be expired after 20 days
//expiresIn: 120 // it will be expired after 120ms
//expiresIn: "120s" // it will be expired after 120s
//var privateKey = fs.readFileSync('private.key');
//var token = jwt.sign({ foo: 'bar' }, privateKey, { algorithm: 'RS256'});



function verifyToken(req, res, next) {
    const bearerHeader = req.headers['authorization'];
    if (typeof bearerHeader !== 'undefined') {
        const bearer = bearerHeader.split(' ');
        // Get token from array
        const bearerToken = bearer[1];
        // Set the token
        req.token = bearerToken;
        // Next middleware
        jwt.verify(bearerToken, sercretKey, (err, authData) => {
            if (err) {
                res.status(401).send('Unauthorized');
            } else {
                // var c = jwt.decode(bearerToken); // { name: 'Nguyen Duc Hiep', iat: 1612684313, exp: 1612684343 }
                // console.log(c);
                next();
            }
        });
    } else {
        res.sendStatus(403);
    }
}
// muon doc du lieu trong token => https://www.npmjs.com/package/jwt-decode

module.exports = router;