public class quickPriceSearch {
    @AuraEnabled(cacheable = true)
    public static list<PricebookEntry> getPricing(string priceBookId, string searchKey){
         string searchterm = '%' + searchKey + '%'; 
         string pbId = priceBookId;
         string pClass = 'Simple';
         string status = 'Non-Stock';
        string vgUser = '005VH000003w8I1YAI';
        system.debug(searchterm);
        //system.debug(pbId);
         string query = 'Select Id,'
             		+ 'Product2.Name, Floor_Price__c, Product2.Product_Status__c,Product2.ProductCode, Agency_Product__c,product2.Total_Product_Items__c,'
             		+ ' Product2.Floor_Price__c,Floor_Margin__c, Level_1_UserView__c, Level_One_Margin__c, Level_2_UserView__c, Level_2_Margin__c, Product_Cost__c'
             		+ ' From PricebookEntry Where IsActive = True and Pricebook2Id =: pbId AND Product2.ProductClass =:pClass AND Product2.Product_Status__c !=: status AND '
             		+ ' Product2.CreatedById !=: vgUser AND (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)'
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
    //@AuraEnabled(cacheable = true)
    //public static list<productitem> searchInventory(string term, string locId){
      //  list<productitem> counts = new list<productitem>();
        //string searchTerm = '%'+term+'%'; 
        //if(locId == 'All'){
            
          //  counts = [select Total_Product_Items__c, Product_Code__c,Quantity_Available__c,Product2.Name 
            //          from ProductItem where Product_Class__c = 'Simple' and (Product_Code__c like: searchTerm or Product2.Name like: searchTerm)
              //       order by Product2.Product_Status__c, quantityonhand desc nulls last];
            
       // }else{
         //   counts = [select QuantityOnHand, Product_Code__c, Quantity_Available__c,Product2.Name 
           //           from ProductItem where Product_Class__c = 'Simple' and LocationId =: locId 
             //                and (Product_Code__c like: searchTerm or Product2.Name like: searchTerm)
               //      order by Product2.Product_Status__c, quantityonhand desc nulls last];
        
       // }

//        return counts; 
  //  }
    
	@AuraEnabled(cacheable = true)
    public static list<productitem> warehouseInventory(string query){
        list<productitem> results = Database.query(query);
        return results; 
    }
    ///VG INFO///
    //get vg price books
    @AuraEnabled(cacheable = true)
    public static list<Pricebook2> vgPriceBooks(){
        list<Pricebook2> pricebooks = [select Id, Name from Pricebook2 where Valley_Green__c = true];
        return pricebooks; 
    }
    @AuraEnabled(cacheable = true)
    public static list<PricebookEntry> vgGetPricing(list<string> priceBookIds, string searchKey){
         string searchterm = '%' + searchKey + '%'; 
     	 list<string> pbIds = priceBookIds;
        string sObjectname = 'PricebookEntry';
        system.debug(searchterm + ' '+pbIds);
        //system.debug(pbId);
         string query = 'Select Id,'
             		+ 'Product2.Name, Product2id, Product2.Product_Status__c, Product2.ProductCode, Agency_Product__c, product2.Total_Product_Items__c,'
             		+ ' UnitPrice, Product_Cost__c, Pricebook2.Name, Pricebook2Id'
                    + ' From '+sObjectname+' Where Product2.Valley_Green__c = True AND Pricebook2Id in:priceBookIds'
             		+ ' AND (Product2.ProductCode like :searchTerm or Product2.Name like :searchTerm)';
        //system.debug(query);
        list<PricebookEntry> results = Database.query(query);
        //system.debug(results);
        return results; 
      
    }
    
    //get the warehouse that store products. 
	@AuraEnabled(cacheable = true)
    public static List<Schema.Location> getVGWarehouse(){
        List<Schema.Location> warehouse = [select id, name, Location_Number__c from Location 
                                           where IsInventoryLocation =true and LocationType = 'VG' order by Name asc];
        
        return warehouse; 
    }
    
	@AuraEnabled
    public static list<productitem> inVGCounts(list<string> pc, string locId){
        list<productitem> counts = new list<productitem>();
         
        if(locId == 'All'){
            
            counts = [select Total_Product_Items__c, Product_Code__c,Quantity_Available__c from
                                    ProductItem where Product_Code__c In :(pc)];
            
        }else{
            
            counts = [select QuantityOnHand, Product_Code__c, Quantity_Available__c from
                             ProductItem where LocationId =: locId 
                             and Product_Code__c In :(pc)];
        
        }

        return counts; 
    }    
}