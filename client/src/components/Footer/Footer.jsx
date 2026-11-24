import React from "react";
import ComapanyLogo from "../../assets/logo (1).svg";

export default function Footer() {
  return (
    <>
      <footer className="mt-10 bg-black text-white py-16">
        <div className="container-custom grid gap-5 lg:gap-0 grid-cols-1 md:grid-cols-2 lg:grid-cols-4 ">
          {/* Company section start */}
          <div>
            <img src={ComapanyLogo} alt={ComapanyLogo} />
            <p className="text-sm pt-5">
              We are a dedicated Eye Care and Vision Health Center committed to
              providing advanced, Diagnostic Treatments.
            </p>
          </div>
          <div>
            <h3 className=" capitalize  font-semibold">company</h3>
            <div className="flex flex-col gap-4 mt-4">
              <a href="">About</a>
              <a href="">Clinics</a>
              <a href="">works</a>
              <a href="">Features</a>
              <a href="">Contact Us</a>
            </div>
          </div>
          <div>
            {" "}
            <h3 className=" capitalize  font-semibold">Need help?</h3>
            <div className="flex flex-col gap-4 mt-4">
              <div>
                <span>Visit Our Clinic</span>
                <p>1250 Sunset Boulevard</p>
              </div>
              <div>
                <span>General Inquiries </span>
                <p>info@example.com</p>
              </div>
              <div>
                <span>Call us on</span>
                <p> +1 54565 64578</p>
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <h3 className=" capitalize  font-semibold">
              Keep in touch with us
            </h3>
            <p>
              Subscribe our newsletter to get the latest news and updates From
              Doccure !
            </p>
            <input
              type="text"
              className="bg-white text-slate-600 rounded-md py-4 pl-4 placeholder:text-slate-500  outline-0   "
              placeholder="Enter Email Address"
            />
          </div>
          {/* Company section End */}
        </div>
      </footer>
    </>
  );
}
