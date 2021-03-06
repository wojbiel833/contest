const requestIp = require("request-ip");

const Photo = require("../models/photo.model");
const Voter = require("../models/voters.model");

/****** SUBMIT PHOTO ********/

exports.add = async (req, res) => {
  try {
    const { title, author, email } = req.fields;
    const file = req.files.file;

    if (title && author && email && file) {
      // if fields are not empty...

      const fileName = file.path.split("/").slice(-1)[0]; // cut only filename from full path, e.g. C:/test/abc.jpg -> abc.jpg
      const fileExt = fileName.split(".").slice(-1)[0];
      console.log(fileExt);

      if (title.length <= 25) return new Error("Title ist too long");
      if (author.length <= 25) return new Error("Author ist too long");
      if (!email.includes("@")) return new Error("Author ist too long");

      // const title = new RegExp(
      //   /(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
      //   "g"
      // );
      // const author = new RegExp(
      //   /(<\s*(strong|em)*>(([A-z]|\s)*)<\s*\/\s*(strong|em)>)|(([A-z]|\s|\.)*)/,
      //   "g"
      // );

      // const textMatched1 = text.match(title).join("");
      // const textMatched2 = text.match(author).join("");

      // if (
      //   textMatched1.length < title.length ||
      //   textMatched2.length < author.length
      // )
      //   throw new Error("Invalid characters...");

      function escape(str) {
        return str
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;")
          .replace(/"/g, "&quot;")
          .replace(/'/g, "&#039;");
      }

      const titleParsed = escape(title);
      const authorParsed = escape(author);
      const emailParsed = escape(email);

      if (
        fileExt === "png" ||
        fileExt === "jpg" ||
        fileExt === "jpeg" ||
        fileExt === "gif"
      ) {
        const newPhoto = new Photo({
          titleParsed,
          authorParsed,
          emailParsed,
          src: fileName,
          votes: 0,
        });
        await newPhoto.save(); // ...save new photo in DB
        res.json(newPhoto);
      }
    } else {
      throw new Error("Wrong input!");
    }
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** LOAD ALL PHOTOS ********/

exports.loadAll = async (req, res) => {
  try {
    res.json(await Photo.find());
  } catch (err) {
    res.status(500).json(err);
  }
};

/****** VOTE FOR PHOTO ********/

exports.vote = async (req, res) => {
  try {
    // Przy pr??bie lajkowania zdj??cia, sprawdzaj czy w kolekcji voters znajduje si?? ju?? wpis dla danego adresu IP.
    const IP = requestIp();
    const voter = await Voter.findOne({ user: IP });
    const photoToUpdate = await Photo.findOne({ _id: req.params.id });

    if (!photoToUpdate || !voter)
      res.status(404).json({ message: "Not found" });
    else {
      // Je??li nie, to stw??rz go i dodaj od razu do jego atrybutu votes identyfikator polubionego zdj??cia. Pozw??l te?? na normaln?? modyfikacj?? ilo??ci g??os??w,
      const newVoter = new Voter({
        user: IP,
        votes: photoToUpdate._id,
      });
      // czyli kr??tko m??wi??c, je??li osoba jeszcze nigdy nie g??osowa??a, zapisz informacj?? o niej w bazie
      newVoter.save();

      // oraz to, ??e w??a??nie zag??osowa??a na dane zdj??cie, a nast??pnie faktycznie dodaj g??os.
      photoToUpdate.votes++;
      photoToUpdate.save();
      res.send({ message: "OK" });

      // Dodaj warunek, kt??ry zak??ada, ??e dany adres IP jednak ju?? jest w bazie.
      if (newVoter.user == IP) {
        // W takiej sytuacji dodaj kod sprawdzaj??cy, czy g??osowano na wybrane zdj??cie.
        if (!newVoter.votes.includes(photoToUpdate._id)) {
          newVoter.votes.updateOne({ votes: photoToUpdate._id });
        }
        // Je??li jednak oka??e si??, ??e ju?? g??osowano na to zdj??cie, to zwr???? b????d serwera (500)
        else res.status(500).json(err);
      }
    }
  } catch (err) {
    res.status(500).json(err);
  }
};
