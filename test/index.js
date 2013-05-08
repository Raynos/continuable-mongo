var test = require("tape")
var uuid = require("uuid")
var bind = require("continuable/bind")

var mongo = require("../index")

test("continuable-mongo is a function", function (assert) {
    assert.equal(typeof mongo, "function")
    assert.end()
})

test("can insert and read from db", function (assert) {
    var client = mongo("mongodb://localhost:27017/continuable-mongo-tests")
    var temp = client.collection("temp_collection")
    var id = uuid()

    var insertion = temp.insert([{ id: id }])

    var record = bind(function (records) {
        assert.equal(records.length, 1)

        return temp.findOne({ id: id })
    })(insertion)

    record(function (err, value) {
        assert.ifError(err)
        assert.equal(value.id, id)

        client.close(function (err) {
            assert.ifError(err)

            assert.end()
        })
    })
})

test("can insert & read from db (callbacks)", function (assert) {
    var client = mongo("mongodb://localhost:27017/continuable-mongo-tests")
    var temp = client.collection("temp_collection")
    var id = uuid()

    temp.insert([{ id: id }], function (err, records) {
        assert.ifError(err)
        assert.equal(records.length, 1)

        temp.findOne({ id: id }, function (err, value) {
            assert.ifError(err)
            assert.equal(value.id, id)

            client.close(function (err) {
                assert.ifError(err)

                assert.end()
            })
        })
    })
})

test("can call stream on cursor", function (assert) {
    var client = mongo("mongodb://localhost:27017/continuable-mongo-tests")
    var temp = client.collection("stream_collection_" + uuid())
    var id = uuid()

    temp.insert([{ id: id }, { id2: id }], function (err, records) {
        assert.ifError(err)
        assert.equal(records.length, 2)

        var stream = temp.find().stream()
        var list = []

        stream.on("data", function (r) {
            list.push(r)
        })

        stream.on("end", function () {
            assert.equal(list.length, 2)
            assert.equal(list[0].id, id)
            assert.equal(list[1].id2, id)

            client.close(function (err) {
                assert.ifError(err)

                assert.end()
            })
        })
    })
})
