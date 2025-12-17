import React from "react";
import { useState, useEffect } from "react";
import { Textarea } from "@/components/Textarea";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectGroup,
  SelectLabel,
  SelectItem,
  SelectValue,
  Button,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  TxtField,
} from "@/components";
import { FaUser } from "react-icons/fa";

export function NewAddress() {
  return (
    <div>
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="primary" size="sm" iconName="Plus">
            Add new address
          </Button>
        </DialogTrigger>

        <DialogContent className="flex flex-col sm:max-w-[300px] md:max-w-[425px] h-[80%] overflow-y-auto overflow-x-hidden custom-scrollbar justify-start items-start">
          <DialogHeader>
            <DialogTitle>Add new address</DialogTitle>
            <form className="flex flex-wrap gap-4 py-2">
              <div className="flex md:flex-row sm:flex-col gap-4">
                <TxtField
                  label="Full name"
                  variant="outline"
                  size="sm"
                  type="text"
                  placeholder="Enter your full name"
                />
                <TxtField
                  label="Phone number"
                  type="tel"
                  variant="outline"
                  size="sm"
                  placeholder="Enter your full name"
                />
              </div>

              <Textarea
                label="Street name"
                type="text"
                variant="outline"
                size="sm"
                placeholder="Enter your address"
              />

              <div className="space-y-2 w-full">
                <p className="text-sm font-medium text-neutral-800">Province</p>
                <Select className="dropdown-province">
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Province</SelectLabel>

                      <SelectItem value="abcd">
                        <div>abcd</div>
                      </SelectItem>
                      <SelectItem value="1234">
                        <div>1234</div>
                      </SelectItem>
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-4 w-full">
                <div className="space-y-2 w-full">
                  <h6 className="text-sm font-medium text-neutral-800">
                    City
                  </h6>
                  <Select className="flex-row dropdown-city">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="City" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>City</SelectLabel>

                        <SelectItem value="abcd">
                          <div>abcd</div>
                        </SelectItem>
                        <SelectItem value="1234">
                          <div>1234</div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <h6 className="text-sm font-medium text-neutral-800">
                    District
                  </h6>
                  <Select className="dropdown-district">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="District" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>District</SelectLabel>

                        <SelectItem value="abcd">
                          <div>abcd</div>
                        </SelectItem>
                        <SelectItem value="1234">
                          <div>1234</div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <h6 className="text-sm font-medium text-neutral-800">
                    Sub district
                  </h6>
                  <Select className="dropdown-subdistrict">
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sub-district" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Sub district</SelectLabel>

                        <SelectItem value="abcd">
                          <div>abcd</div>
                        </SelectItem>
                        <SelectItem value="1234">
                          <div>1234</div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 w-full">
                  <Select className="dropdown-postal-code w-full">
                    <span className="text-sm font-medium text-neutral-800">
                      Postal code
                    </span>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Postal code" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectLabel>Postal code</SelectLabel>

                        <SelectItem value="abcd">
                          <div>40212</div>
                        </SelectItem>
                        <SelectItem value="1234">
                          <div>40213</div>
                        </SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </form>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  );
}
