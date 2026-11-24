import React from "react";
import { Card, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";

export default function ArticlesSection() {
  return (
    <>
      <section className="mt-12 ">
        <div className="container-custom flex flex-col">
          <div className="flex justify-center items-center">
            <div className="">
              <div className="flex justify-center">
                <span className="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-green-500 px-4 py-2 text-sm font-semibold text-white shadow-sm">
                  ✦ Blogs & Articles
                </span>
              </div>

              <h2 className="mt-5 max-w-[700px] text-2xl font-bold leading-tight text-slate-900 xl:text-4xl">
                Stay Updated With Our{" "}
                <span className="bg-gradient-to-r from-blue-600 to-cyan-400 bg-clip-text text-transparent">
                  Latest Articles
                </span>
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-7">
            <Card className=" overflow-hidden w-full max-w-sm pt-0 mt-6  group">
              <div>
                <img
                  src="https://doccure.dreamstechnologies.com/html/template/assets/img/blog/general-blog-01.jpg"
                  alt=""
                  className="w-6xl  object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                />
              </div>
              <CardHeader>
                <CardTitle>Design systems meetup</CardTitle>
                <CardDescription>
                  A practical talk on component APIs, accessibility, and
                  shipping faster.
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className=" overflow-hidden w-full max-w-sm pt-0 mt-6  group">
              <div>
                <img
                  src="https://doccure.dreamstechnologies.com/html/template/assets/img/blog/general-blog-01.jpg"
                  alt=""
                  className="w-6xl  object-cover transition-transform duration-300 ease-in-out hover:scale-110"
                />
              </div>
              <CardHeader>
                <CardTitle>Design systems meetup</CardTitle>
                <CardDescription>
                  A practical talk on component APIs, accessibility, and
                  shipping faster.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
          <div className="mt-5 flex justify-center">
            <Button className="text-center w-40 h-12 cursor-pointer ">
              View All Blogs
            </Button>
          </div>
        </div>
      </section>
    </>
  );
}
