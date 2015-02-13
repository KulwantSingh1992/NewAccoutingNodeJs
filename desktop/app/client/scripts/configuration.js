var configuration = {
    version: 1.0,
    url: 'http://localhost:3000',
};

//key of marketPlaceChannelNames is mapped with setting pages form-id
var marketPlaceChannelNames = {
    fk: {channelName: "FK", fullName: "Flipkart"},
    amazon: {channelName: "AMAZON", fullName: "Amazon"},
	sd: {channelName: "SD", fullName: "Snapdeal"},
    paytm: {channelName: "PTM", fullName: "Paytm"},
    tally: {channelName: "TALLY", fullName: "Tally"}
};
var inputType = {
    text: "text",
    number: "number",
	checkbox: "checkbox"
};

var flipkartChannelConfigs = {
    required: [
        {name: "channel_sku",inputType: inputType.text , label: "Flipkart Serial No",desc:"The unique identification code for each product to be assigned on a channel"},
        {name: "seller_sku", inputType: inputType.text, label: "Seller SKU Id" ,desc:"The unique identification code for each product to be assigned by a seller"},
        {name: "listed_price", inputType: inputType.text , label: "₹ Selling Price" ,desc:"The final value of a product at which it will be sold at the marketplace"},
    ],
    others: [
        {name: "procurement_sla", inputType: inputType.text ,label: "SLA(Days)" ,desc:"The number of  Service level Agreement  days to ship a product by the seller"},
        {name: "local_shipping_charge", inputType: inputType.text ,label: "Local Shipping" ,desc:"The shipping charges to be levied on an order by the seller,being shipped to a local place"},
        {name: "national_shipping_charge", inputType: inputType.text ,label: "National Shipping" ,desc:"The shipping charges to be levied on an order by the seller, being shipped nationally"},
        {name: "zonal_shipping_charge", inputType: inputType.text ,label: "Zonal Shipping" ,desc:"The shipping charges to be levied on an order by the seller,being shipped to a zone"},
		{name: "price_error_check", inputType: inputType.checkbox ,label: "Enable price check" ,desc:"Enable price check feature to avoid human errors for your product MRP/Selling Price.", enable: "enable", disable: "disable", isVisible:"false"}
    ]
};
var amazonChannelConfigs = {
    required: [
        {name: "channel_sku", inputType: inputType.text ,label: "ASIN" ,desc:"Amazon ASIN Number"},
        {name: "seller_sku", inputType: inputType.text ,label: "Seller SKU" ,desc:"Seller SKU"},
        {name: "listed_price", inputType: inputType.text ,label: "Selling Price" ,desc:"This is the price of the item you want to sell"},
    ],
    others: [
        {name: "leadtime_to_ship", inputType: inputType.text ,label: "Leadtime To Ship(Days)" ,desc:"Leadtime To Ship"}
    ]
};

var snapdealChannelConfigs = {
    required: [
        {name: "channel_sku", inputType: inputType.text ,label: "SUPC" ,desc:"Snapdeal SUPC Number"},
        {name: "seller_sku", inputType: inputType.text ,label: "Seller SKU" ,desc:"Seller SKU"},
        {name: "listed_price", inputType: inputType.text ,label: "Selling Price" ,desc:"This is the price of the item you want to sell"},
    ],
    others: [
        {name: "dispatch_sla", inputType: inputType.text ,label: "Dipatch SLA(Days)" ,desc:"The number of  Service level Agreement  days to ship a product by the seller"}
    ]
};

var marketPlaceChannelConfigs = [{
    channelName: marketPlaceChannelNames.fk.channelName,
    fullName: marketPlaceChannelNames.fk.fullName,
    config: flipkartChannelConfigs
}, {
    channelName: marketPlaceChannelNames.amazon.channelName,
    fullName: marketPlaceChannelNames.amazon.fullName,
    config: amazonChannelConfigs
},{
    channelName: marketPlaceChannelNames.sd.channelName,
    fullName: marketPlaceChannelNames.sd.fullName,
    config: snapdealChannelConfigs
}];