var fs = require('fs');

eval(fs.readFileSync('./test/testSetup.js')+'');

describe('gulp-extify', function(){
    describe("file ordering", function () {
        it("should pipe a single file", function () {
            sort([fixture("app/Application.js")], function(resultFiles) {
                resultFiles.length.should.equal(1);
                resultFiles[0].should.equal("app"+path.sep+"Application.js");
            });
        });

        describe("general parse behaviors", function () {
            it("should parse all Ext.define's and should pay attention to each of the requirements", function () {
                sort([
                    fixture("app/mixin/MyMixin.js"),
                    fixture("app/base/Root.js"),
                    fixture("app/controller/MulitpleDefinitionsInOneFileController.js")
                ], function(resultFiles) {
                    resultFiles.length.should.equal(3);
                    resultFiles[0].should.equal("app" + path.sep + "base"+path.sep+"Root.js");
                    resultFiles[1].should.equal("app" + path.sep + "mixin"+path.sep+"MyMixin.js");
                    resultFiles[2].should.equal("app" + path.sep + "controller"+path.sep+"MulitpleDefinitionsInOneFileController.js");
                });
            });

            it("should not parse inner defines", function () {
                sort([
                    fixture("app/base/ClassWithInnerDefines.js"),
                    fixture("app/base/ClassThatRequiresInnerDefine.js")
                ], function(resultFiles) {
                    resultFiles.length.should.equal(2);

                    resultFiles[0].should.equal("app" + path.sep + "base"+path.sep+"ClassThatRequiresInnerDefine.js");
                    resultFiles[1].should.equal("app" + path.sep + "base"+path.sep+"ClassWithInnerDefines.js");
                });
            });
        });

        describe("requires", function () {
            it("should put Root before application because application depends on root independent of file input ordering", function () {
                sort([fixture("app/Application.js"),fixture("app/controller/Root.js")], function(resultFiles) {
                    resultFiles.length.should.equal(2);
                    resultFiles[0].should.equal("app"+path.sep+"controller"+path.sep+"Root.js");
                    resultFiles[1].should.equal("app"+path.sep+"Application.js");

                });
                sort([fixture("app/controller/Root.js"),fixture("app/Application.js")], function(resultFiles) {
                    resultFiles.length.should.equal(2);
                    resultFiles[0].should.equal("app"+path.sep+"controller"+path.sep+"Root.js");
                    resultFiles[1].should.equal("app"+path.sep+"Application.js");
                });
            });

            it("should requires classes that are plain strings and no array like require: 'myclass' ", function () {
                sort([fixture("app/requires/Req1.js"), fixture("app/requires/Req2.js")], function(resultFiles) {
                    resultFiles.length.should.equal(2);
                    resultFiles[0].should.equal("app" + path.sep + "requires"+path.sep+"Req2.js");
                    resultFiles[1].should.equal("app" + path.sep + "requires"+path.sep+"Req1.js");
                });
            });
        });

        describe("extend", function () {
            it("should put base.root before controller.root because controller.root depends on base.root independent of file input ordering", function () {
                sort([fixture("app/Application.js"),fixture("app/controller/Root.js"),fixture("app/base/Root.js")], function(resultFiles) {
                    resultFiles.length.should.equal(3);
                    resultFiles[0].should.equal("app"+path.sep+"base"+path.sep+"Root.js");
                    resultFiles[1].should.equal("app"+path.sep+"controller"+path.sep+"Root.js");
                    resultFiles[2].should.equal("app"+path.sep+"Application.js");
                });
                sort([fixture("app/Application.js"),fixture("app/base/Root.js"),fixture("app/controller/Root.js")], function(resultFiles) {
                    resultFiles.length.should.equal(3);
                    resultFiles[0].should.equal("app"+path.sep+"base"+path.sep+"Root.js");
                    resultFiles[1].should.equal("app"+path.sep+"controller"+path.sep+"Root.js");
                    resultFiles[2].should.equal("app"+path.sep+"Application.js");
                });
            });
        });

        describe("mixins", function () {
            it("should parse simple mixins", function () {
                sort([
                    fixture("app/controller/BindableController.js"),
                    fixture("app/mixin/BindableMixin.js"),
                    fixture("app/mixin/BindableMixinOther.js")

                ], function(resultFiles) {
                    resultFiles.length.should.equal(3);
                    resultFiles.indexOf("app"+path.sep+"mixin"+path.sep+"BindableMixin.js").should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"BindableController.js"));
                    resultFiles.indexOf("app"+path.sep+"mixin"+path.sep+"BindableMixinOther.js").should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"BindableController.js"));
                });
            });

            it("should parse object mixins", function () {
                sort([
                    fixture("app/base/Root.js"),
                    fixture("app/controller/Root.js"),
                    fixture("app/mixin/MyMixin.js"),
                    fixture("app/mixin/MyOtherMixin.js"),
                    fixture("app/Application.js")

                ], function(resultFiles) {
                    resultFiles.length.should.equal(5);
                    resultFiles.indexOf("app"+path.sep+"base"+path.sep+"Root.js").should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Root.js"));
                    resultFiles.indexOf("app"+path.sep+"mixin"+path.sep+"MyOtherMixin.js").should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Root.js"));
                    resultFiles.indexOf("app"+path.sep+"mixin"+path.sep+"MyMixin.js").should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Root.js"));
                    resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Root.js").should.be.below(resultFiles.indexOf("app"+path.sep+"Application.js"));
                });
            });
        });

        describe("model", function () {
            it("should handle model defitions of stores like commmon dependencies", function () {
                sort([
                    fixture("app/Application.js"),
                    fixture("app/controller/Root.js"),
                    fixture("app/store/MyStore.js"),
                    fixture("app/model/MyModel.js"),
                    fixture("app/base/Root.js")

                ], function(resultFiles) {
                    //console.log(resultFiles);
                    resultFiles.length.should.equal(5);
                    resultFiles.indexOf("app"+path.sep+"model"+path.sep+"MyModel.js").should.be.below(resultFiles.indexOf("app"+path.sep+"store"+path.sep+"MyStore.js"));
                });
            });
        });

        describe("controller-deps", function () {
            describe("subcontrollers", function () {
                it("should handle application subcontrollers like dependencies", function () {
                    sort([
                        fixture("app/Application.js"), // <-- file contains controller/Regular as subcontroller
                        fixture("app/controller/Regular.js"), // <-- should be loaded before app/Application
                    ], function(resultFiles) {
                        resultFiles.length.should.equal(2);
                        resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Regular.js")
                            .should.be.below(resultFiles.indexOf("app"+path.sep+"Application.js"));
                    })
                });
            });

            describe("views", function () {
                it("should handle controller views like dependencies", function () {
                    sort([
                        fixture("app/Application.js"),
                        fixture("app/controller/Regular.js"),
                        fixture("app/model/RegularByController.js"),
                        fixture("app/model/Regular.js"),
                        fixture("app/store/Regular.js"),
                        fixture("app/view/Regular/Panel.js"),
                    ], function(resultFiles) {
                        resultFiles.length.should.equal(6);
                        resultFiles.indexOf("app"+path.sep+"view"+path.sep+"Regular"+path.sep+"Panel.js")
                            .should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Regular.js"));
                    })
                });
            });

            describe("stores", function () {
                it("should handle application subcontrollers like dependencies", function () {
                    sort([
                        fixture("app/Application.js"),
                        fixture("app/controller/Regular.js"),
                        fixture("app/model/RegularByController.js"),
                        fixture("app/model/Regular.js"),
                        fixture("app/store/Regular.js"),
                        fixture("app/view/Regular/Panel.js"),
                    ], function(resultFiles) {
                        resultFiles.length.should.equal(6);
                        resultFiles.indexOf("app"+path.sep+"store"+path.sep+"Regular.js")
                            .should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Regular.js"));
                    })
                });
            });

            describe("models", function () {
                it("should handle controller models like dependencies", function () {
                    sort([
                        fixture("app/Application.js"),
                        fixture("app/controller/Regular.js"),
                        fixture("app/model/RegularByController.js"),
                        fixture("app/model/Regular.js"),
                        fixture("app/store/Regular.js"),
                        fixture("app/view/Regular/Panel.js"),
                    ], function (resultFiles) {
                        resultFiles.length.should.equal(6);
                        resultFiles.indexOf("app"+path.sep+"model"+path.sep+"Regular.js")
                            .should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Regular.js"));
                        resultFiles.indexOf("app"+path.sep+"model"+path.sep+"Regular.js")
                            .should.be.below(resultFiles.indexOf("app"+path.sep+"store"+path.sep+"Regular.js"));
                        resultFiles.indexOf("app"+path.sep+"model"+path.sep+"RegularByController.js")
                            .should.be.below(resultFiles.indexOf("app"+path.sep+"controller"+path.sep+"Regular.js"));
                    });
                });
            });
        });
    });

    describe("errors", function () {
        it("should be read with gulp.src", function () {
            sort([
                "app/controller/Empty.js"
            ], function(resultFiles) {
                resultFiles.length.should.equal(0);
            }, function(err) {
                err.message.length.should.be.above(0);
                err.plugin.should.equal("gulp-extify");
            });
        });

        it("should have no circular dependencies", function () {
            sort([
                fixture("app/mixin/MyMixin.js"),
                fixture("app/mixin/MyOtherMixin.js"),
                fixture("app/Application.js"),
                fixture("app/controller/Root.js"),
                fixture("app/base/Root.js"),
                fixture("app/controller/CircDepControllerOne.js"),
                fixture("app/controller/CircDepControllerTwo.js")
            ], function(resultFiles) {

            }, function(err) {
                err.message.should.equal("At least 1 circular dependency in nodes: " +
                "\n" +
                "\n" +
                "My.controller.CircDepControllerOne\n" +
                "My.base.Root\n" +
                "My.controller.CircDepControllerTwo\n" +
                "\n" +
                "Graph cannot be sorted!");
                err.plugin.should.equal("gulp-extify");
            });
        });
    });
});