process.env.NODE_ENV = "test";
const app = require("../app");
const request = require("supertest");
const connection = require("../db/connection");
const { response } = require("express");
// 1 vQyKA3FuWdSAxBVs8MX3rKYCefi1
// 2 knQicRC1k1UGAROHO5HlnSYUIfS2

describe("/api", () => {
  beforeEach(() => connection.seed.run());
  afterAll(() => connection.destroy());

  test("GET API responds with 200 and a JSON object with descriptions of all available end points", () => {
    return request(app)
      .get("/api")
      .expect(200)
      .then(({ body }) => {
        expect(body).toHaveProperty("API");
        expect(typeof body.API).toBe("object");
      });
  });
  // USERS *************************
  describe("/api/users", () => {
    test("POST returns 201 and object containing new user", () => {
      return request(app)
        .post("/api/users")
        .send({
          user_id: "kjhDKJH98",
          username: "clsfoy",
          name: "charlie",
          email: "charlie@gmail.com",
          location: [53.8008, 1.5491],
        })
        .expect(201)
        .then(({ body: { user } }) => {
          expect(Object.keys(user)).toEqual([
            "user_id",
            "username",
            "name",
            "email",
            "avatar_pic",
            "location",
            "user_rating",
          ]);
        });
    });
    describe("/api/users/:user_id", () => {
      test("GET request returns 200 and object containing user data with specified ID", () => {
        return request(app)
          .get("/api/users/vQyKA3FuWdSAxBVs8MX3rKYCefi1")
          .expect(200)
          .then(({ body: { user } }) => {
            expect(Object.keys(user)).toEqual([
              "user_id",
              "username",
              "name",
              "email",
              "avatar_pic",
              "location",
              "user_rating",
            ]);
          });
      });
      test("PATCH returns 201 and object containing updated user", () => {
        return request(app)
          .patch("/api/users/vQyKA3FuWdSAxBVs8MX3rKYCefi1")
          .send({
            username: "bob",
          })
          .expect(201)
          .then(({ body: { user } }) => {
            expect(user.username).toBe("bob");
          });
      });
      test("PATCH returns 201 and updates user rating", () => {
        return request(app)
          .patch("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2")
          .send({
            user_score: 3,
          })
          .expect(201)
          .then(({ body: { user } }) => {
            expect(user.user_rating).toBe(3);
          });
      });
      test("DELETE request returns 204 for successful delete", () => {
        return request(app)
          .delete("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2")
          .expect(204)
          .then(() => {
            return connection
              .select("*")
              .from("users")
              .where("user_id", "=", "knQicRC1k1UGAROHO5HlnSYUIfS2");
          })
          .then((rows) => {
            expect(rows.length).toBe(0);
          });
      });
    });
    describe("ERRORS", () => {
      it("POST - 400 empty post request", () => {
        return request(app)
          .post("/api/users")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Empty request body");
          });
      });
      it("POST - 400 incorrect data type", () => {
        return request(app)
          .post("/api/users")
          .send({
            name: "steve",
            username: "stevo",
            email: "stevo@gmail.com",
            location: "liverpool",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Invalid input type");
          });
      });
      it("POST - 400 incomplete request", () => {
        return request(app)
          .post("/api/users")
          .send({
            name: "steve",
            username: "stevo",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Incomplete request");
          });
      });
      it("POST - 400 incomplete request", () => {
        return request(app)
          .post("/api/users")
          .send({
            user_id: "kjhakjhf",
            name: "steve",
            username: "stevelad83",
            email: "example@email.com",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Value not unique");
          });
      });
      it("GET - 404 id out of range", () => {
        return request(app)
          .get("/api/users/1000")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("User does not exist");
          });
      });
      it("DELETE - 404 id out of range", () => {
        return request(app)
          .delete("/api/users/1000")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("User does not exist");
          });
      });
      it("PATCH - 400 empty request", () => {
        return request(app)
          .patch("/api/users/2")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Empty request body");
          });
      });
      it("PATCH - 400 invalid request", () => {
        return request(app)
          .patch("/api/users/2")
          .send({ potato: 1 })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Invalid input type");
          });
      });
      it("PATCH - 404 user does not exist", () => {
        return request(app)
          .patch("/api/users/1000")
          .send({ name: "Eric" })
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("User does not exist");
          });
      });
    });
  });
  // USERS BOOKS *************************
  describe("/api/users/:user_id/books", () => {
    // GET
    test("GET - responds with 200 and array of all books owned by specified owner", () => {
      return request(app)
        .get("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/books")
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.book_count).toBe(2);
          expect(books.books.length).toBe(2);
        });
    });
    // SORT/FILTER BOOKSHELF BOOKS
    test("GET - allows users to sort bookshelves by date added - default order desc", () => {
      return request(app)
        .get("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/books")
        .then(({ body: { books } }) => {
          expect(books.books).toBeSortedBy("date_posted", { descending: true });
        });
    });
    test("GET - allows users to sort bookshelves by date added - default order asc", () => {
      return request(app)
        .get(
          "/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/books?sort_by=date_posted&order=asc"
        )
        .then(({ body: { books } }) => {
          expect(books.books).toBeSortedBy("date_posted");
        });
    });
    test("GET returns books object with empty array if user has no books on bookshelf", () => {
      return request(app)
        .get("/api/users/hqkndna98934lkmdsDD88m/books")
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.book_count).toBe(0);
          expect(books.books.length).toBe(0);
        });
    });

    // POST
    test("POST - responds with 201, allows user to post book and returns object containing newly added book", () => {
      return request(app)
        .post("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/books")
        .send({
          title: "Pride and Prejudice",
          authors: ["Jane Austen", "Steve"],
          published_year: 2016,
          ISBN: "9781911060130",
          thumbnail:
            "http://books.google.com/books/content?id=dZ7zjwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
          quality: 4,
          owner_comments: "My fave book",
        })
        .expect(201)
        .then(({ body: { book } }) => {
          expect(Object.keys(book).length).toBe(15);
        });
    });
    // ERRORS
    describe("ERRORS", () => {
      test("GET - 404 user does not exist", () => {
        return request(app)
          .get("/api/users/100/books")
          .expect(404)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("User does not exist");
          });
      });

      test("POST - 400 empty request", () => {
        return request(app)
          .post("/api/users/1/books")
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Incomplete request");
          });
      });
      test("POST - 400 user does not exist", () => {
        return request(app)
          .post("/api/users/3/books")
          .send({
            title: "Pride and Prejudice",
            authors: ["Jane Austen", "Steve"],
            published_year: 2016,
            ISBN: "9781911060130",
            thumbnail:
              "http://books.google.com/books/content?id=dZ7zjwEACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api",
            quality: 4,
            owner_comments: "My fave book",
          })
          .expect(400)
          .then(({ body: { msg } }) => {
            expect(msg).toBe("Bad request");
          });
      });
    });
  });

  // ALL BOOKS *******************
  describe("/api/books", () => {
    // GET
    test("GET all books, responds with 200 and an array of book objects and book count key", () => {
      return request(app)
        .get("/api/books")
        .send({ user_id: "vQyKA3FuWdSAxBVs8MX3rKYCefi1" })
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.book_count).toBe(2);
          expect(books.books.length).toBe(2);
        });
    });
    // SORT
    test("GET return books SORTED by most recently added as default", () => {
      return request(app)
        .get("/api/books")
        .send({ user_id: "vQyKA3FuWdSAxBVs8MX3rKYCefi1" })
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.books).toBeSortedBy("date_posted", { descending: true });
        });
    });
    test("GET accepts queries sort_by and order", () => {
      return request(app)
        .get("/api/books?sort_by=date_posted&order=asc")
        .send({ user_id: "vQyKA3FuWdSAxBVs8MX3rKYCefi1" })
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.books).toBeSortedBy("date_posted");
        });
    });
    test("GET accepts queries SORT_BY and ORDER", () => {
      return request(app)
        .get("/api/books?sort_by=published_year")
        .send({ user_id: "vQyKA3FuWdSAxBVs8MX3rKYCefi1" })
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.books).toBeSortedBy("published_year", {
            descending: true,
          });
        });
    });
    test("GET accepts queries SORT_BY and ORDER", () => {
      return request(app)
        .get("/api/books?sort_by=quality&order=asc")
        .send({ user_id: "vQyKA3FuWdSAxBVs8MX3rKYCefi1" })
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.books).toBeSortedBy("quality");
        });
    });
    // FILTER
    test("GET accepts FILTER query allowing users to filter books by title", () => {
      return request(app)
        .get("/api/books?title=harry%20potter")
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.books[0].title).toBe(
            "Harry Potter and the Order of the Phoenix"
          );
        });
    });
    test("GET accepts FILTER query allowing users to filter books by author", () => {
      return request(app)
        .get("/api/books?author=tolkien")
        .expect(200)
        .then(({ body: { books } }) => {
          expect(books.books[0].authors).toBe("J. R. R. Tolkien");
        });
    });
  });
  // SINGLE BOOK *******************
  describe("/api/books/:book_id", () => {
    test("GET individual book, responds with 200 and a single book object", () => {
      return request(app)
        .get("/api/books/4")
        .expect(200)
        .then(({ body: { book } }) => {
          expect(book.book_id).toBe(4);
          expect(Object.keys(book).length).toBe(15);
        });
    });
    test("PATCH responds with 201 and object containing updated book", () => {
      return request(app)
        .patch("/api/books/2")
        .send({
          owner_comments: "The best book ever written IMO",
          display_book: false,
        })
        .expect(201)
        .then(({ body: { book } }) => {
          expect(book.owner_comments).toBe("The best book ever written IMO");
          expect(book.quality).toBe(4);
          expect(book.display_book).toBe(false);
        });
    });
    // UPDATE - UPLOAD BOOK PHOTOS
    // UPDATE/SWAP
    test("PATCH - book swap responds with 201 and updated book (updates owner and adds prev owner)", () => {
      return request(app)
        .patch("/api/books/2")
        .send({ new_owner_id: "vQyKA3FuWdSAxBVs8MX3rKYCefi1" })
        .expect(201)
        .then(({ body: { book } }) => {
          expect(book.owner_id).toBe("vQyKA3FuWdSAxBVs8MX3rKYCefi1");
          //expect(book.previous_owners).toEqual([1, 2]);
        });
    });
    // DELETE
    test("DELETE - responds with 204 and removes book", () => {
      return request(app)
        .delete("/api/books/2")
        .expect(204)
        .then(() => {
          return connection
            .select("*")
            .from("books")
            .where("book_id", "=", 2)
            .then((book) => {
              expect(book.length).toBe(0);
            });
        });
    });

    // ERRORs
    test("PATCH - book swap responds with 400 for invalid new owner id", () => {
      return request(app)
        .patch("/api/books/2")
        .send({ new_owner_id: "bob" })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid input type");
        });
    });
    test("PATCH - book swap responds with 400 for invalid new owner id", () => {
      return request(app)
        .patch("/api/books/2")
        .send({ new_owner_id: 100000 })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Bad request");
        });
    });
    test("PATCH - book swap responds with 404 for out of range book", () => {
      return request(app)
        .patch("/api/books/1000000000")
        .send({ new_owner_id: 2 })
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Book does not exist");
        });
    });
    test("PATCH - book swap responds with 400 for invalid book id", () => {
      return request(app)
        .patch("/api/books/notAnId")
        .send({ new_owner_id: 2 })
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid input type");
        });
    });
    test("GET individual book, responds with 400 if not a valid book id", () => {
      return request(app)
        .get("/api/books/notAnId")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid input type");
        });
    });
    test("GET individual book, responds with 404 if out of range book id", () => {
      return request(app)
        .get("/api/books/10000")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Book does not exist");
        });
    });
    test("DELETE - 400 for invalid book ID", () => {
      return request(app)
        .delete("/api/books/notAnId")
        .expect(400)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Invalid input type");
        });
    });
    test("DELETE - 404 nonexistent book", () => {
      return request(app)
        .delete("/api/books/100000")
        .expect(404)
        .then(({ body: { msg } }) => {
          expect(msg).toBe("Book does not exist");
        });
    });
  });
  // EXCHANGING BOOKS
  describe.only("/api/books/exchanges", () => {
    it.only("GET responds with 200 and array of all exchanges", () => {
      return request(app)
        .get("/api/users/vQyKA3FuWdSAxBVs8MX3rKYCefi1/exchanges")
        .expect(200)
        .then(({ body: { exchanges } }) => {
          expect(exchanges.length).toBe(2);
        });
    });
    it("POST responds with 201 and exchange request submitted", () => {
      return request(app)
        .post("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/exchanges")
        .send({ book_id: 4 })
        .expect(201)
        .then(({ body: { exchange } }) => {
          expect(typeof exchange).toBe("object");
        });
    });
    it("PATCH responds with 201 and updated exchange request if one side has sent/received book", () => {
      return request(app)
        .patch("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/exchanges/1")
        .send({ book_sent: true })
        .expect(201)
        .then(({ body: { exchange } }) => {
          expect(exchange.book_sent).toBe(true);
        });
    });
    it("PATCH responds with 201 and updated exchange request if one side has sent/received book", () => {
      return request(app)
        .patch("/api/users/knQicRC1k1UGAROHO5HlnSYUIfS2/exchanges/1")
        .send({ book_sent: true })
        .then(() => {
          return request(app)
            .patch("/api/users/vQyKA3FuWdSAxBVs8MX3rKYCefi1/exchanges/1")
            .send({ book_received: true })
            .expect(201)
            .then(({ body: { exchange } }) => {
              expect(exchange.book_received).toBe(true);
              return connection
                .select("owner_id")
                .from("books")
                .where("book_id", 1)
                .then(([{ owner_id }]) => {
                  expect(owner_id).toBe("vQyKA3FuWdSAxBVs8MX3rKYCefi1");
                  return connection
                    .select("*")
                    .from("exchanges")
                    .where("exchange_id", 1)
                    .then((response) => {
                      expect(response.length).toBe(0);
                    });
                });
            });
        });
    });
    it.only("DELETE responds with 204", () => {
      return request(app)
        .delete("/api/users/vQyKA3FuWdSAxBVs8MX3rKYCefi1/exchanges/1")
        .expect(204)
        .then(() => {
          return connection
            .select("*")
            .from("exchanges")
            .where("exchange_id", 1)
            .then((response) => {
              expect(response.length).toBe(0);
            });
        });
    });
  });
});
