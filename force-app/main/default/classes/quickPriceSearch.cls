public class quickPriceSearch {
    @AuraEnabled(cacheable = true)
    public static list<PricebookEntry> getPricing(string priceBookId, string searchKey){
         string searchterm = '%' + searchKey + '%'; 
         string pbId = priceBookId;
         string pClass = 'Simple';
        system.debug(searchterm);
        //system.debug(pbId);
         string query = 'Select Id,'
             		+ 'Product2.Name, Floor_Price__c, Product2.Product_Status__c,Product2.ProductCode, Agency_Product__c,product2.Total_Product_Items__c,'
             		+ ' Product2.Floor_Price__c,Floor_Margin__c, Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c, Product_Cost__c'
             		+ ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND Product2.ProductClass =:pClass AND'
             		+ ' (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)'
        			+ ' order by Product_Status__c  desc nulls last';
        //system.debug(query);
        list<PricebookEntry> results = Database.query(query);
        //system.debug(results);
        return results; 
      
    }
    //get the warehouse that store products. 
	@AuraEnabled(cacheable = true)
    public static List<Schema.Location> getWarehouse(){
        List<Schema.Location> warehouse = [select id, name, Location_Number__c from Location 
                                           where IsInventoryLocation =true and LocationType = 'ATS' and name like '%ATS%'
                                          order by Location_Number_Number__c asc];
        
        return warehouse; 
    }
    
        //this allows the user to switch the inventory check on the product screen 
    @AuraEnabled(cacheable = true)
    public static list<productitem> inCounts(list<string> pc, string locId){
        list<productitem> counts = new list<productitem>();
         
        if(locId == 'All'){
            
            counts = [select Total_Product_Items__c, Product_Code__c,Quantity_Available__c from
                                    ProductItem where Product_Class__c = 'Simple' and Product_Code__c In :(pc)];
            
        }else{
            counts = [select QuantityOnHand, Product_Code__c, Quantity_Available__c from
                             ProductItem where Product_Class__c = 'Simple' and LocationId =: locId 
                             and Product_Code__c In :(pc)];
        
        }

        return counts; 
    }
    
       //this allows the user to switch the inventory check on the product screen 
    @AuraEnabled(cacheable = true)
    public static list<productitem> searchInventory(string term, string locId){
        list<productitem> counts = new list<productitem>();
        string searchTerm = '%'+term+'%'; 
        if(locId == 'All'){
            
            counts = [select Total_Product_Items__c, Product_Code__c,Quantity_Available__c,Product2.Name 
                      from ProductItem where Product_Class__c = 'Simple' and (Product_Code__c like: searchTerm or Product2.Name like: searchTerm)];
            
        }else{
            counts = [select QuantityOnHand, Product_Code__c, Quantity_Available__c,Product2.Name 
                      from ProductItem where Product_Class__c = 'Simple' and LocationId =: locId 
                             and (Product_Code__c like: searchTerm or Product2.Name like: searchTerm)];
        
        }

        return counts; 
    }
    
    @AuraEnabled(cacheable = true)
    public static string userLocation(string userId){
        string warehouse = [select my_location__c from user where id =:userId].My_Location__c; 
        return warehouse; 
    }

    @AuraEnabled(cacheable=true)
public static List<Map<String,String>> getPicklistValues(String objectName, String fieldName) {
    Boolean hasDefault = false;
    List<Map<String,String>> values = new List<Map<String,String>>();


    for(PicklistEntry e: ((SObject)(Type.forName('Schema.'+objectName).newInstance())).getSObjectType()
    .getDescribe().fields.getMap().get(fieldName).getDescribe().getPicklistValues()) 
    {
        if(e.isActive()) {
            values.add(
                new Map<String, String> {
                    'label' => e.getLabel(),
                        'value' => e.getValue()
                        }
            );       
        }  

        if(e.isDefaultValue()) {
            hasDefault = true;
        }
    }
    // we need to add a blank picklist value if a field has no default value,
    // because that means the field is blank in the UI.       
    if(!hasDefault) { 
        values.add(0,
                    new Map<String, String> {
                        'label' => '',
                            'value' => null
                            }
                   );         
    }

    return values;
}
}