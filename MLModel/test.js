import { toast } from "react-toastify";
import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import Cookie from "js-cookie";
import Router, { useRouter } from "next/router";
import { billingSummaryService } from "../../services/BillingSummary/BillingSummaryService";

import useURLParams from "../../hooks/useURLParams";
import { ProfessionalInfoService } from "../../services/UtilityService/ProfessionalInfo";
import InputMask from "react-input-mask";
import { getOperatorFromCookie } from "@/helpers/cookie-parser";
import useAuthorizedRoles from "@/hooks/useAuthorizedRoles";
import { checkElementRole, checkSectionRole } from "@/helpers/auth-helpers";
import { APP_ROUTES } from "@/helpers/enums";
import { UserRightsService } from "@/services/AuthorizationService/UserRightsManagement";
import { CustomerService } from "../../services/CustomerManagement/CustomerCreation/Customer";
const initialFields = {
  MAC_BINDING_TYPE: "",
  UN_BINDING_TYPE: "",
  CURRENT_MAC_ADDRESS: "",
  MAC_ADDRESS: "",
  COMMENTS: "",
  USERID: "",
  DEPARTMENT: "",
  SUB_DEPARTMENT: "",
};

export default function CustomerMacBinding() {
  const {
    getAuthorizedRoles,
    loadingRoles,
    authorizationState,
    sectionAuthorizationState,
    elementAuthorizationState,
    isAdmin,
  } = useAuthorizedRoles();
  const { pathname } = useRouter();
  const [checkValidUserId, setCheckValidUserId] = useState(false);
  const [checkValidUserIdRes, setCheckValidUserIdRes] = useState(true);
  const [feilds, setFeilds] = useState(initialFields);

  const handleChanged = (e) => {
    const { name, value } = e.target;

    if (name === "MAC_BINDING_TYPE") {
      setFeilds({
        ...feilds,
        [name]: value,
        UN_BINDING_TYPE: "",
      });
    } else if (name === "MAC_ADDRESS") {
      let formattedValue = value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();

      if (formattedValue.length > 2) {
        formattedValue = formattedValue.match(/.{1,2}/g).join(":");
      }

      if (formattedValue.length <= 17) {
        setFeilds({ ...feilds, [name]: formattedValue });
      }
    } else {
      setFeilds({ ...feilds, [name]: value });
    }
  };

  const URLParams = useURLParams();

  useEffect(() => {
    if (URLParams && URLParams?.userid) {
      getCustomerMacAddress(URLParams?.userid);
    } else {
    }
  }, [URLParams]);

  useEffect(() => {
    checkUserIdExist();
  }, [URLParams?.userid]);

  const checkUserIdExist = async () => {
    let res = await CustomerService.checkUserIdExist(URLParams?.userid);
    if (res) {
      const result = await res.json();

      if (result.status === "SUCCESS") {
        setCheckValidUserId(true);
      }

      setCheckValidUserIdRes(false);
    }
  };

  const getCustomerMacAddress = async (userid) => {
    let response = await billingSummaryService.getMacAddressForMacBinding(
      userid
    );
    if (response) {
      let getReponse = await response.json();
      if (getReponse.status === "SUCCESS") {
        setFeilds((prev) => {
          return { ...prev, CURRENT_MAC_ADDRESS: getReponse.data?.MAC };
        });
      } else {
      }
    }
  };

  const customerMacBinding = async (e) => {
    e.preventDefault();
    let response;
    const operator = getOperatorFromCookie();

    if (feilds.MAC_BINDING_TYPE === "bind_chk") {
      if (!feilds.MAC_ADDRESS) {
        return toast.error("Enter Mac Address");
      } else if (!feilds.COMMENTS) {
        return toast.error("Enter Comments");
      } else if (feilds.MAC_ADDRESS.length > 30) {
        return toast.error("Maximum 30 characters allowed for Mac Address");
      } else if (feilds.COMMENTS.length > 100) {
        return toast.error("Maximum 100 characters allowed for Comments");
      }
      const payLoad = {
        USERID: URLParams?.userid,
        MAC_ADDRESS: feilds.MAC_ADDRESS,
        CURRENT_MAC_ADDRESS: feilds.CURRENT_MAC_ADDRESS,
        OPERATOR: operator,
        COMMENTS: feilds.COMMENTS,
      };

      response = await billingSummaryService.customerMacBinding({
        ...payLoad,
      });

      let getResponse = await response.json();
      console.log(getResponse)
      if (getResponse[0].status === "SUCCESS") {
        toast.success("Customer MAC has been Binded");
        setFeilds(initialFields);
        getCustomerMacAddress(URLParams?.userid);
      } else {
        Router.push(APP_ROUTES.SERVER_ERROR);
      }
    }

    if (feilds.MAC_BINDING_TYPE === "unbind_chk") {
      if (!feilds.CURRENT_MAC_ADDRESS) {
        return toast.error("No Mac Address is Binded to this User Currently");
      } else if (!feilds.COMMENTS) {
        return toast.error("Enter Comments");
      } else if (feilds.COMMENTS.length > 100) {
        return toast.error("Maximum 100 characters allowed for Comments");
      }
      const payLoad = {
        USERID: URLParams?.userid,
        CURRENT_MAC_ADDRESS: feilds.CURRENT_MAC_ADDRESS,
        OPERATOR: operator,
        COMMENTS: feilds.COMMENTS,
      };

      response = await billingSummaryService.customerMacUnBinding({
        ...payLoad,
      });

      let getResponse = await response.json();

      if (getResponse[0].status === "SUCCESS") {
        toast.success("Customer MAC has been UnBinded");
        setFeilds(initialFields);
      } else {
        toast.error(getResponse[0].message);
      }
    }
  };

  const authorizedSubmodule = async () => {
    const user = getOperatorFromCookie();
    const response = await UserRightsService.getAuthorizedSubmodule({
      EMPID: user,
      URL: pathname,
    });

    if (response) {
      const res = await response.json();

      if (res.status === "SUCCESS") {
        let submoduleId = res.data?.[0]?.["SUBMODULE_ID"];
        if (submoduleId) {
          await getAuthorizedRoles(submoduleId);
        }
      }
    } else {
      Router.push(APP_ROUTES.SERVER_ERROR);
    }
  };
  return (
    <>
      <Layout authorizedSubmoduleProp={authorizedSubmodule}>
        {!loadingRoles && !checkValidUserIdRes && (
          <>
            {checkValidUserId ? (
              <div className="container">
                <div className="panel-wrapper collapse in pt-0 mt-0">
                  <div className="panel-body">
                    <div className="panel panel-inverse card-view">
                      <div className="panel-heading panel-heading-div custom-bg-color rounded-top">
                        <div className="pull-left">
                          <h6 className="panel-title text-white weight-400 font-16">
                            Customer Mac Binding
                          </h6>
                        </div>

                        <div className="clearfix"></div>
                      </div>
                      <div className="panel-body">
                        <div className="text-center mt-2">
                          <div className="d-flex justify-content-center align-items-center">
                            <h6>User ID :</h6>
                            <h6 className="badgeSuccess2 mx-1 w-25 px-2">
                              {URLParams?.userid}
                            </h6>
                          </div>
                        </div>

                        <div className="row my-4 ">
                          <div className=" form-group col-md-6 col-sm-12 ">
                            <label className="control-label mb-1 text-left font-14 weight-500 ">
                              Mac Binding Type:
                            </label>
                            <div className="row my-3 ">
                              <div className=" col-md-6 col-sm-12 ">
                                <input
                                  type="radio"
                                  id="bind_chk"
                                  class="mr-2"
                                  name="MAC_BINDING_TYPE"
                                  checked={
                                    feilds.MAC_BINDING_TYPE === "bind_chk"
                                  }
                                  value="bind_chk"
                                  onChange={handleChanged}
                                />
                                <label for="bind_chk">Mac Binding</label>
                              </div>
                              <div className=" col-md-6 col-sm-12 ">
                                <input
                                  type="radio"
                                  id="unbind_chk"
                                  class="mr-2"
                                  name="MAC_BINDING_TYPE"
                                  checked={
                                    feilds.MAC_BINDING_TYPE === "unbind_chk"
                                  }
                                  value="unbind_chk"
                                  onChange={handleChanged}
                                />
                                <label for="unbind_chk">Mac UnBinding</label>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="row">
                          {feilds.MAC_BINDING_TYPE === "bind_chk" && (
                            <div className=" form-group col-md-6 col-sm-12 ">
                              <label className="control-label mb-1 text-left font-14 weight-500">
                                Mac Address:
                              </label>

                              <InputMask
                                className="form-control"
                                type="text"
                                name="MAC_ADDRESS"
                                maskChar="#"
                                placeholder="00:00:00:00:00:00"
                                value={feilds.MAC_ADDRESS}
                                onChange={handleChanged}
                              />
                            </div>
                          )}

                          <div className="col-md-6 col-sm-12 ">
                            <label className="control-label mb-1 text-left font-14 weight-500">
                              Comment:
                            </label>
                            <textarea
                              type="text"
                              className="w-100 border rounded"
                              placeholder="Enter Comments"
                              name="COMMENTS"
                              value={feilds.COMMENTS}
                              onChange={handleChanged}
                            ></textarea>
                          </div>
                        </div>

                        <div className="row text-right">
                          <div className="col-md-12 col-sm-12">
                            <button
                              className="btn btn-primary btn-fixed-width m-4"
                              style={{ background: "#284E93" }}
                              onClick={customerMacBinding}
                            >
                              Submit
                            </button>
                          </div>
                        </div>

                        <div className="row">
                          <div className="form-group col-md-6 col-sm-12 ">
                            <label className="control-label mb-1 text-left font-14 weight-500">
                              Current Mac Address
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="CURRENT_MAC_ADDRESS"
                              value={
                                feilds.CURRENT_MAC_ADDRESS
                                  ? feilds.CURRENT_MAC_ADDRESS
                                  : "N/A"
                              }
                              style={{
                                borderTopRightRadius: "0",
                                borderBottomRightRadius: "0",
                              }}
                              disabled={true}
                              onChange={handleChanged}
                            />
                          </div>
                        </div>
                        <hr />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  color: "red",
                  fontSize: "16px",
                  fontWeight: "bold",
                  textAlign: "center",
                  marginTop: "20px",
                }}
              >
                Invalid User Id
              </div>
            )}
          </>
        )}
      </Layout>
    </>
  );
}
