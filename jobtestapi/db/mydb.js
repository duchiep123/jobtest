var moogoose = require('mongoose');
moogoose.connect('mongodb+srv://dbUser:123@cluster0.knc4f.mongodb.net/JobtestDB?retryWrites=true&w=majority', { useNewUrlParser: true, useUnifiedTopology: true });
var db = moogoose.connection;


db.on('error', function(err) {
    if (err) console.log(err)
});

db.once('open', function() {
    console.log("Connected !");

});